# Brainstorm: improving how the pages are built

Status: **idea 5 (a Vite build step) was chosen and implemented**, together with the Vitest tests from idea 3 and shared files from ideas 1 and 2. Ideas 4 and 6 were not used. This document is kept as the record of the options and trade-offs. The "problem" section describes the code as it was before the change; `CLAUDE.md` describes how things work now.

What changed because of the decision:
- Pages are now markup in `index.html`, with CSS in `style.css`, behaviour in `main.js`, testable maths in `layout.js` / `grid.js`, and shared code in `shared/`.
- The single-file, works-from-`file://` promise is gone. Use `npm run dev`, `npm run preview`, or the live site.
- The CSP is stricter (`'self'` instead of `'unsafe-inline'`).
- GitHub Pages now deploys from a GitHub Actions workflow (`.github/workflows/pages.yml`) that runs the tests first, instead of "Deploy from a branch".

## The problem

Each exercise is one self-contained HTML file with its CSS and JavaScript inline. That was a deliberate, simple start (see `CLAUDE.md`), but with two exercises the costs are showing:

| File | Total lines | CSS lines | JS lines |
| --- | --- | --- | --- |
| `macdonald-form-field-cards/index.html` | 567 | about 266 | about 188 |
| `hart-chart/index.html` | 470 | about 244 | about 133 |

- **Duplicated CSS.** Reset, body, headings, controls panel, sliders, buttons, note, disclaimer and print rules are copy-pasted into every page and the template. A style fix has to be made in every file, and the copies will drift.
- **Duplicated JavaScript.** Both pages repeat the same ideas: the Arial cap-height constant, the `MIN_LETTER_MM` warning, the letter sets, the mm sizing, the amber warning note, and the print-at-100% message.
- **Hard to test.** The layout math (ring fitting, grid sizing, no-adjacent-repeat letters) is tangled with DOM code. So far it has been tested by pasting snippets into the browser console, not by an automated test.
- **Hard to read and review.** 500-line files mix three languages, and scrolling past 250 lines of CSS to reach the logic is tedious for both people and Claude.
- **Template drift.** `_template/index.html` is a third copy that already differs slightly from the real pages.

## Constraints to keep in mind

These limit which ideas below actually work:

1. **Must work from `file://`.** The project promise is "open the HTML file and it works". ES modules (`<script type="module">`) are blocked on `file://` in most browsers, because of CORS. Classic `<script src="...">` and `<link rel="stylesheet">` work.
2. **Content-Security-Policy.** Pages use `default-src 'none'` with inline style and script allowed. External files would need `style-src 'self'` and `script-src 'self'`. That is a small change, and `'self'` is stricter than `'unsafe-inline'`, so it could actually improve security (see idea 1).
3. **GitHub Pages serves this repo from a subpath** (`/vision-therapy-tools/`), so every link must be relative. See "GitHub Pages compatibility" below for what else the host allows and does not allow.
4. **No frameworks or build step** is the current rule. Relaxing it is a real decision, not a detail.
5. **Print accuracy matters.** Any refactor must keep mm-based, true-size printing, and the CSS and JS have to stay readable by a therapist who opens "view source".

## Ideas, roughly from least to most change

### 1. Shared stylesheet and shared script (classic files)

Create `shared/style.css` and `shared/common.js`, loaded with ordinary `<link>` and `<script src>` tags.

- **Moves out of the pages:** the reset, controls panel, buttons, note, disclaimer, print basics; and helpers such as `shuffle`, the `CAP_HEIGHT` and `MIN_LETTER_MM` constants, the size-note builder, and the amber-warning toggle.
- **Pages keep:** only their own layout CSS and their own generator logic, probably 100 to 150 lines each.
- **Pros:** the biggest payoff for the least change. Works on `file://`. No tooling. CSP can become `style-src 'self'; script-src 'self'`, which removes `'unsafe-inline'` and makes the CSP genuinely strong against injected scripts.
- **Cons:** pages are no longer single files you can email, though a zipped folder still works. Shared globals can collide unless wrapped (for example in one `VT` namespace object). Relative paths are `../shared/...` from each exercise folder, so the template must get them right.
- **Gotcha:** classic scripts share one global scope, so name things carefully.

### 2. Split each page into `index.html`, `style.css`, `app.js`

Same idea per exercise, without sharing: three small files per folder.

- **Pros:** readable files, syntax highlighting and linting work properly, the HTML shows structure at a glance.
- **Cons:** by itself it does not remove duplication. Best combined with idea 1.

### 3. Pull the pure logic into testable modules

Put the math in plain functions with no DOM access, for example:

- `fitRings`, `layoutRings` (cards)
- `buildGrid`, grid sizing (Hart chart)
- `pickLetters`, `shuffle`

Then test them with Node's built-in test runner (`node --test`), which needs no install, just a `tests/` folder.

- **Pros:** the checks I ran by hand (1,620 layout combinations, no adjacent repeats, no clipping) become permanent tests. Safe refactors. Fits the "no npm dependencies" rule, since `node --test` is built in.
- **Cons:** the functions must be loadable by both the browser and Node. Without ES modules on `file://` that means a small UMD-style wrapper (`if (typeof module !== 'undefined') module.exports = ...`) or putting the logic in a file that is only a set of functions. This is a bit ugly, but small.
- **Alternative:** accept a build step later and use real modules (idea 5).

### 4. Generate pages from a template and data

Describe each exercise as data (title, subtitle, list of controls with id, label, min, max, default, unit) and render the controls panel from it in JavaScript. Most of each page's HTML today is repeated slider markup.

- **Pros:** about 100 lines of HTML disappear per page. Adding a control is one line. The value readouts are wired up in one place instead of by hand each time (`syncDisplays` is currently written twice).
- **Cons:** a mini framework to maintain, and the page is less obvious to read. May be over-engineering for 2 to 5 exercises.
- **Middle path:** one small `makeSlider(...)` helper in `shared/common.js`, with the HTML still written out.

### 5. Add a small build step (Vite or similar)

Use real ES modules, import shared code, bundle each exercise, and publish `dist/`.

- **Pros:** proper modules, TypeScript if wanted, tree shaking, hot reload while developing, tests with Vitest.
- **Cons:** breaks "no build, no dependencies, works on `file://`" unless the build emits plain files (it can, with the right config). It adds `package.json`, a lockfile, Dependabot alerts, and a GitHub Actions deploy workflow in place of the built-in Pages build. More to maintain for a small project.
- **When it would be worth it:** 8 or more exercises, or wanting TypeScript, or many contributors.

### 6. Web components for the common UI

A `<vt-slider label="Rows" min=".." max=".." value="..">` custom element and a `<vt-note>` that handles live display and warning style.

- **Pros:** no build, native browser feature, and each exercise's HTML becomes short and declarative.
- **Cons:** needs a shared script anyway (idea 1). Shadow DOM and print CSS can be fiddly. Custom elements also take some learning to debug.

## Smaller improvements worth doing along the way

- **One source for constants.** `CAP_HEIGHT`, `MIN_LETTER_MM`, page size and the Arial font stack are defined separately in each page.
- **Make `BORDER_MM` and the CSS border one value.** Today a comment says "keep in sync". A CSS custom property (`--border: 0.8mm`) read from JS would remove that trap.
- **A real print-preview check.** Add a documented manual checklist (or a Playwright script) that prints each page to PDF and checks the page count and that nothing is cut off.
- **Keep the template honest.** Generate `_template/` from the real shared pieces, or add a test that it still parses and contains the required tags (CSP, disclaimer, back link).
- **Accessibility pass.** The Hart chart is `role="img"` with a label, so screen readers get no letters; fine for a visual exercise, but worth a conscious decision. Check contrast of the grey row numbers and the amber warning.
- **Lint and format with no install.** An `.editorconfig` (LF, 2 spaces) costs nothing and helps on both Mac and Windows.
- **Landing page from data.** The root `index.html` lists tools by hand. A small `tools.json`, or a README-driven list, would stop it drifting out of sync with the README table.

## GitHub Pages compatibility

What the host (GitHub Pages, serving `main` from the repo root) allows and does not allow, and how that affects each idea.

How sure each claim is:
- **Confirmed in GitHub's docs:** the size, bandwidth and build limits, the `404.html` support, and the public-repo requirement on a free plan ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)).
- **Confirmed on this site:** `_template/` returns 404 because of the Jekyll underscore rule, and the site stopped rebuilding when Actions was restricted.
- **Not looked up, from general knowledge:** that there is no setting for custom response headers or `_redirects`. Both are widely documented as unsupported on GitHub Pages, but I have not checked the current docs.
- **Expected, not tested:** anything marked "expected".

### What works

- **Plain static files:** HTML, CSS, JavaScript, images, fonts, JSON. The whole current site is this.
- **Classic `<link>` and `<script src>` files** next to the pages (idea 1 and 2), as long as the paths are relative.
- **ES modules over HTTPS.** They work on the live site, but not when a page is opened from disk (`file://`), which is a browser limit, not a host limit.
- **Service workers and PWAs.** Pages is served over HTTPS, which they require. The scope follows the subpath, so register with a relative path.
- **A custom 404 page.** A `404.html` in the root is used for missing URLs.
- **A custom domain** with HTTPS enforced, if you ever want one.
- **Printing, mm sizing, and everything else that runs in the browser.**

### What does not work, or needs care

| Limit | Why it matters here |
| --- | --- |
| **No custom HTTP headers** (not looked up) | A CSP header cannot be sent, so the `<meta http-equiv="Content-Security-Policy">` tag has to do the job. A meta tag cannot set `frame-ancestors`, so the pages can still be embedded in someone else's frame. Other security headers (X-Content-Type-Options, Referrer-Policy and so on) cannot be set either |
| **No server-side code, redirects or rewrites** | Fine for this project. A `_redirects` file is not supported (that is a Netlify feature; not looked up). Old URLs can only be kept alive with a small HTML page that redirects with a meta refresh or script. Note the Macdonald cards already moved from `/` to `/macdonald-form-field-cards/`, so old links now land on the landing page |
| **Served from a subpath** | Root-relative links like `/shared/style.css` would point at `dan98765.github.io/shared/...` and 404. Use `../shared/style.css` style links |
| **Jekyll runs on the branch deploy** | Folders and files starting with `_` (such as `_template/`) are skipped, so `_template/` is not published (confirmed: it returns 404 on the live site). Add an empty `.nojekyll` file if you ever want a folder like `_shared/` to be served, or avoid the underscore |
| **The built-in deploy needs Actions enabled** | "Deploy from a branch" runs on a GitHub-owned Actions workflow. Setting Actions to disabled or to "only this account's actions" stops the site updating without any error on push (this happened once; see `CLAUDE.md`) |
| **A build step needs a custom workflow** | With "Deploy from a branch" there is no place to run Vite or another bundler. You would switch Pages to the "GitHub Actions" source and add a workflow that builds and uploads the output. That workflow uses GitHub-published actions, so the repo's allowed-actions setting must permit them (the same setting that broke the site before). Pages' own soft limit of 10 builds an hour does not apply to a custom workflow |
| **Everything in the published folder is public** | The repo is public anyway. Do not rely on obscurity |
| **Free Pages needs a public repo** | On GitHub Free, Pages works only for public repositories. Private-repo Pages needs a paid plan (Pro, Team or Enterprise), so making this repo private would take the site down on a free plan |
| **Limits** | Published site: 1 GB maximum (recommended 1 GB for the source repo). Bandwidth: soft limit of 100 GB a month. Builds: soft limit of 10 an hour for the branch deploy. This site is tiny, so only the build limit could plausibly be hit, by many quick pushes in a row. Check the linked page for current numbers if large assets are ever added |

### Compatibility of each idea

| Idea | Works on GitHub Pages as-is? | Notes |
| --- | --- | --- |
| 1. Shared stylesheet and script (classic files) | Yes | Use `../shared/` relative paths. CSP becomes `style-src 'self'; script-src 'self'`. Avoid an underscore folder name (Jekyll), or add `.nojekyll` |
| 2. Split into HTML, CSS and JS files | Yes | Same as above |
| 3. Pure logic plus `node --test` tests | Yes | Tests run on your machine. If you want them in CI, that is a separate Actions workflow, and Actions must stay enabled |
| 4. Controls generated from data | Yes | Browser-only code |
| 5. Build step (Vite or similar) | Only with a custom Actions workflow | Switch the Pages source to "GitHub Actions" and keep Actions allowed (see above). The build output must be plain static files with relative asset paths (Vite: `base: './'`). This also adds a `package.json`, a lockfile and dependency alerts |
| 6. Web components | Yes | Browser-only code |
| Service worker or PWA (open question) | Yes | HTTPS is provided. Register with a relative path so the scope matches the subpath |
| ES modules (`type="module"`) | Yes on the live site, no from `file://` | The `file://` limit is the browser's |

### Practical advice

- Keep the "relative links only" rule. Test links with `python -m http.server` from the repo root.
- Keep the CSP meta tag on every page, since headers are not an option.
- After any change to deployment (Actions settings, Pages source, moving files), check `gh api repos/dan98765/vision-therapy-tools/pages/builds --jq '.[0]'` shows the latest commit as `built`, then load the live URLs.
- Consider a tiny redirect page at any URL you move, if people may have bookmarked it.
- Batch pushes when you can. Many rapid pushes can hit the 10-builds-an-hour soft limit, and in-flight builds are cancelled when a newer commit arrives (it happened once in this repo).

Source for the limits and plan rules: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## A possible path

1. **Idea 1 plus the `.editorconfig`.** Shared CSS and JS as classic files, CSP tightened to `'self'`, and the template updated. This gets most of the benefit and keeps every promise except "single file".
2. **Idea 3.** Extract the pure logic and add `node --test` tests, turning the stress checks into regression tests.
3. **Revisit idea 4 or 6** only if the controls panel keeps being copy-pasted.
4. **Consider idea 5** only if the project grows well past a handful of exercises.

## Open questions

- Is "send someone a single HTML file" a real use case, or is a folder or the website fine? This decides whether idea 1 is acceptable.
- Is it important that the code is easy to read for non-programmers who use "view source"?
- How many exercises are likely: 3 to 5, or 20 or more?
- Is TypeScript or a test runner something you want, or is a few well-tested pure functions enough?
- Should the pages work with no internet, installed as a PWA (installable offline app)? That would add a service worker and change the CSP.
