# Vision Therapy Tools

A collection of small, single-purpose vision therapy exercises that run as browser pages. Plain HTML, CSS and vanilla JavaScript, built with Vite and tested with Vitest. No backend, no UI framework, no third-party code at runtime. Published with GitHub Pages.

## Commands

```bash
npm install        # once
npm run dev        # dev server with hot reload (http://localhost:5173)
npm run lint       # ESLint (JS and CSS) and html-validate (HTML)
npm test           # run the Vitest tests once
npm run build      # build to dist/
npm run preview    # serve dist/ locally (http://localhost:4173), the closest thing to the live site
```

The built pages use ES modules, so **opening a file from disk (`file://`) does not work**. Use `npm run dev` or `npm run preview`, or the live site: https://dan98765.github.io/vision-therapy-tools/

## Layout

- `index.html`, `landing.css` — landing page listing every exercise. **Add a card here for each new exercise.** It has no script, so its CSP omits `script-src`.
- `macdonald-form-field-cards/` — Macdonald Form Field Cards (notes in `docs/macdonald-form-field-cards.md`).
- `hart-chart/` — Hart Chart generator (notes in `docs/hart-chart.md`).
- `screen-calibration/` — Screen Calibration utility (notes in `docs/screen-calibration.md`). Its maths is in `shared/calibration.js` so future on-screen tools can reuse it.
- Each exercise folder holds `index.html` (markup only), `style.css`, `main.js` (reads controls, draws), and a file of pure maths with no DOM access (`layout.js`, `grid.js`) that the tests import.
- `shared/` — code and CSS used by every exercise: `style.css`, `letters.js` (letter pools, shuffle, cap-height and minimum-size constants), `format.js` (text for the size note), `paper.js` (does it fit a Letter/A4 page, and what to say about it), `calibration.js` (pixels per real millimetre for the screen), `page.js` (small DOM helpers), `header.html` (the header bar every page shares).
- `tests/` — Vitest tests (`*.test.js`) plus `rng.js`, a seeded random generator so failures are repeatable. `pages.test.js` checks every page, and `_template/`, against the conventions below (strict CSP, no inline code, relative paths, labels, disclaimer, site header) and checks each exercise is on the landing page, in the README and has a `docs/<folder>.md`. A new exercise fails the tests until all of that is done. `pages.test.js` also rejects exercise CSS that depends on background colours. `paper.test.js` covers the page-fit logic, `site-header.test.js` the header, and `hooks.test.js` the git hook and CI commit rules.
- `docs/` — one notes file per exercise (what it is, how it is used, how the page works, gotchas, sources), plus `brainstorm-structure.md` (the options considered when choosing this build setup) and `tool-ideas.md` (a living list of possible new exercises, with what each would need).
- `_template/` — starting point for a new exercise. Copy it, don't edit it.
- `scripts/` — `pages.js` (finds the exercise folders; shared by the build, the HTML linter and the tests), `lint-html.js`, `site-header.js` (fills in the shared header), `check-commits.js` (the CI commit check) and `hooks/` (the git hook code and the shared commit rules).
- `.husky/` — the git hook files (husky); see Git hooks below.
- `eslint.config.js`, `.htmlvalidate.json`, `.editorconfig` — lint and editor settings (see Linting below).
- `vite.config.js` — builds the root `index.html` and every top-level folder that has an `index.html`, except folders starting with `_` or `.` and the tooling folders listed in `scripts/pages.js`. A new exercise needs no config change.

## Adding an exercise

1. Copy `_template/` to a new kebab-case folder next to it (the template's `../shared/` paths expect that depth).
2. Put the maths in its own file and add a test in `tests/`.
3. Add a card to the root `index.html`, a row to the README table, and a notes file in `docs/`. The header bar picks the new exercise up by itself from its `<title>`.
4. Run `npm run lint`, `npm test` (it tells you what is still missing) and `npm run build`, then check the page with `npm run preview`.

## Conventions

- **Vanilla JS and CSS.** No UI framework. The only dependencies are dev-only tools (Vite, Vitest, ESLint and its plugins, html-validate, husky) and none of their code ships in the pages. If a tool seems to need another dependency, stop and ask.
- **No network requests at runtime**: no CDNs, remote fonts or analytics. Everything is bundled from this repo.
- **Keep `index.html` to markup.** CSS goes in `style.css`, behaviour in `main.js`, testable maths in a separate file. Do not add inline `<style>`, `<script>` or `style=""` attributes, because the CSP forbids them. Setting `element.style.x = ...` from JavaScript is fine.
- **Every page has the shared header bar.** Put `<!-- site-header -->` as the first thing inside `<body>` and nothing else: `scripts/site-header.js` (a Vite plugin, also used by the HTML linter and the tests) replaces it with `shared/header.html`, with links made relative to the page and a nav listing every exercise by its `<title>`, the current page marked `aria-current="page"`. Change the header in `shared/header.html` and its styles in `shared/style.css`, never on one page. The bar spans the window by cancelling the page padding with negative margins built from the same `--page-pad-x` / `--page-pad-y` variables as the body, so change the padding there, not as a literal. It is hidden when printing. A page `<title>` should be plain text (escape `&` as `&amp;`), because it becomes a nav label as written. The header exists only in the built and dev-served page, so reading a source `index.html` you will see just the placeholder.
- **Put shared things in `shared/`**, not copied into pages. Do not rely on CSS order: Vite emits page CSS before shared CSS, so a page rule that needs to override a shared rule must be more specific, not just later.
- **Match the existing look** of the other exercises: system font stack, `#f0f2f5` page background, white rounded control panel, `#2563eb` accent, sections separated by `/* ── Name ── */` comment banners.
- **Controls are obvious**: sliders and selects with a visible value readout, sensible defaults so the page is useful on first load. Prefer redrawing live on input; where output is random an explicit Generate button is acceptable so the result doesn't change while adjusting sliders (the Hart chart redraws the same letters for size changes and regenerates for the rest).
- **Printable exercises** (cards, charts) need an `@media print` stylesheet that hides the controls and prints only the exercise at true size. Three rules come from checking real printouts (see Checking print output):
  - **Never draw anything the exercise needs with a background colour or image.** Browsers drop backgrounds when printing unless the user turns on "background graphics", so such a shape silently disappears (the fixation dot once did). Use borders or text. A white or transparent background is fine; `tests/pages.test.js` enforces this for every exercise's `style.css`.
  - **Tell the user when it will not fit a page.** Use `pageNote` from `shared/paper.js` for the note under the buttons: nothing for portrait, "Print in landscape." when only a sideways page fits, an amber warning when it will be cut off or split. Pass `rowsStayWhole: true` for exercises that can continue onto more pages.
  - **Keep rows and cells whole across pages**: `break-inside: avoid` on the items of any grid that can span pages.
- **True-size things can be wider than a phone** (a 140 mm card is about 528 px). Put them in a wrapper with `max-width: 100%; overflow-x: auto` (and `overflow: visible` in print) so the box scrolls, not the whole page, and centre the item with `margin: 0 auto`, not a flex container, which would cut off its left edge. The Hart chart and the cards both do this.
- **Interactive exercises** (timers, moving targets) need a clear start/stop, must respect `prefers-reduced-motion`, and should not flash faster than 3 Hz.
- **Accessibility basics**: real `<label>`s tied to inputs, keyboard operable, adequate contrast. Exercise content may need to be large and high-contrast by design.
- Physical size matters for these exercises (viewing distance, letter size). Where size is meaningful, use real lengths (CSS `mm` is true size in print) rather than abstract pixels. **Users see inches**: controls, readouts and notes are in inches, while the layout maths, tests and CSS stay in mm. Convert at the edge with `shared/units.js` and show with `shared/format.js` (`inchLabel`, `mmAsInches`, `sizeSummary`), and give slider ranges in inches with steps that land on tidy values.
- **Relative links and paths only.** The site is served from a subpath on GitHub Pages, so `/something` links would break. Vite is configured with `base: './'`.

## Linting

`npm run lint` runs two checks, and CI runs it before the tests:

- **ESLint** (`eslint.config.js`) for JavaScript (recommended rules plus `eqeqeq`, `no-var`, `prefer-const`, `no-unused-vars`) and for CSS via `@eslint/css` (invalid properties, no `!important`, and `use-baseline`: only features supported by current browsers). Two cosmetic properties (`accent-color`, `user-select`) are allowed by name in the config, with the reason.
- **html-validate** (`.htmlvalidate.json`, run by `scripts/lint-html.js` on the landing page, every exercise and the template) for valid HTML: for example `type` on every `<button>`, unique ids, labelled controls.

Notes:
- Fix the code rather than disabling a rule. If a rule really has to be relaxed, change it once in the config and say why in a comment.
- No `!important` in CSS. Print rules sit later in the same file as the screen rules they override, which is enough. Shared CSS is emitted after page CSS, so do not rely on order between files.
- Stylelint was tried and rejected: its dependency chain includes `braces`, which has a high-severity advisory with no fix, and that would trip Dependabot and `npm audit`.
- `.editorconfig` sets LF, UTF-8, 2 spaces and a final newline. There is no auto-formatter (no Prettier), by choice.

## Checking print output

Layout checks in a normal browser tab do not show what a printout looks like, so print to PDF with a real browser engine and look at the pages. This found three real bugs (missing fixation dot, silently clipped oversized cards, rows split across pages). Do it after any change to print CSS or to sizes. Nothing here is a repo dependency: install the tools in a scratch folder outside the repo.

1. `npm run build`, then `npm run preview` (http://localhost:4173).
2. In a scratch folder, `npm install puppeteer-core pdf-to-img`, and drive Chrome (`executablePath` to the installed `chrome.exe`) headless.
3. For each case, open the page, set the controls (set the value, dispatch an `input` event, click Generate), then `page.pdf({ format: 'Letter' | 'A4', landscape, margin: 12.7mm on each side (the 0.5 in `shared/paper.js` assumes), printBackground: false })`. **Leave `printBackground` off**: that is what a normal print dialog does.
4. Check the number of pages and the on-page size (`getBoundingClientRect` in print emulation, `px / 96 * 25.4` mm), then convert the PDF pages to PNG (`pdf-to-img`) and look at them.
5. Cases worth covering: the defaults on Letter and A4; the largest card in portrait, landscape and square; a Hart chart with row numbers, 24 rows, and one wider than a page.
6. Cross-check the page-fit messages whenever `shared/paper.js` or a size range changes. For a grid of settings (every card size and aspect ratio; Hart rows, columns, letter heights and row numbers), read the note under the buttons, print on **both** Letter and A4 with 0.5 in margins in the orientation it recommends, and confirm that anything it says fits really is one page with nothing sticking out sideways (lay the page out at the real printable width to see overflow). When last run (226 print runs), all 65 "fits" results held on both papers, and all 24 "will not fit" results really failed on A4 (two of them, 250 mm cards at ratios 0.75 and 1.333, would fit Letter). A card or chart that fits Letter but not A4 correctly warns, because the limits are the smaller of the two.

The default card is 139.7 x 216 mm and the default Hart chart 177 x 142 mm (7.0 x 5.6 in); both print on one page with the controls hidden.

## Git hooks

[husky](https://typicode.github.io/husky/) runs the hooks. `npm install` runs the `prepare` script (`husky`), which sets `core.hooksPath` to `.husky/_` for this clone, so the hooks work on Windows and Mac. If hooks are not running, run `npm run prepare`. Each file in `.husky/` is a one-line command that runs a Node script in `scripts/hooks/`.

- **pre-commit** (`scripts/hooks/pre-commit.js`): refuses the commit unless the git author and committer email is a GitHub noreply address (this repo is public and history is permanent), then runs `npm run lint` and `npm test` on the working tree. It takes a few seconds.
- **commit-msg** (`scripts/hooks/commit-msg.js`): requires Conventional Commits, `type(scope): summary` with type one of feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. Merge, Revert, fixup! and squash! messages are allowed.
- The rules live in `scripts/hooks/checks.js` and are unit tested in `tests/hooks.test.js`, which also checks the `.husky/` files point at scripts that exist and that `prepare` runs husky.
- To change what a hook does, edit the script in `scripts/hooks/`, not the one-line file in `.husky/`.
- `git commit --no-verify` skips both hooks, and `HUSKY=0` disables husky for a command. A clone without `npm install` has no hooks at all.
- **CI backstop** (`.github/workflows/commits.yml`, `scripts/check-commits.js`, same rules from `scripts/hooks/checks.js`): on every pull request it checks the PR title (the squash-merge message comes from it) and each commit's message, and on every push to `main` it checks the pushed commits. It also fails any commit made by the repo owner (the GitHub account that owns the repo) whose author or committer email is not a noreply address; other contributors' emails are not checked. It uses GitHub's API, so no personal address is stored anywhere. On a push to `main` it can only report: the commit is already public.
- **Also turn on, in your GitHub account** (it cannot be set from the repo): Settings → Emails → *Keep my email addresses private* and *Block command line pushes that expose my email*. GitHub then rejects such a push on its side, which no local setting can bypass.
- Hooks check the working tree, not just what is staged, so unstaged edits can make a commit pass or fail.
- Dependabot and the GitHub web editor commit on GitHub, so these local hooks do not apply to them.
- husky was chosen over home-made hooks for familiarity. The repo does not use lint-staged: lint and tests take a few seconds on the whole project. Revisit it if that grows past about 10 seconds.

## Gotchas

- `macdonald-form-field-cards/layout.js` lays out the card in mm (true size when printed at 100%). Letters are auto-shrunk to fit. The border width has a single source, `BORDER_MM`, which `main.js` passes to the CSS as `--border-mm`. See "How layout works" in `docs/macdonald-form-field-cards.md` before changing placement logic.
- The `hidden` attribute loses to any CSS that sets `display` on the same element, so an element can stay visible even though `element.hidden` is true. `shared/style.css` already handles `.control-group[hidden]`; give any other class you hide the same kind of rule, and in checks look at the computed style, not the attribute.
- Form rows must be able to shrink: `.control-group`, selects and range inputs have `min-width: 0` in the shared CSS, otherwise a long option or a wide row pushes the page sideways on a phone.
- When the HTML repeats a fact the JavaScript also uses (a limit, a default, the wording of an option), keep one of them the source and add a test that the other agrees, as `tests/calibration.test.js` does for the calibration page. Otherwise they drift: a slider's `min` had quietly disagreed with the code.
- Letter sizes in the UI are **cap heights** in mm, converted with `CAP_HEIGHT` in `shared/letters.js`.
- Every page has a "not medical advice" footer (`.disclaimer`) that is hidden in `@media print`. Keep it when copying `_template/`.
- Every page has a Content-Security-Policy `<meta>` that blocks all network access (`default-src 'none'`) and allows only scripts and styles from the site itself (`'self'`). Keep it when copying `_template/`. If a tool genuinely needs something more (e.g. `img-src data:` for a canvas export), widen only that directive. A meta CSP cannot set `frame-ancestors`. The dev server adds one extra `connect-src` for its hot-reload websocket (see `vite.config.js`); built pages do not have it.
- The tests in `tests/cards-layout.test.js` check every combination of card settings for clipping and overlap using each letter's ink box. If you change spacing constants and that test fails, believe the test.
- The repo is public: no personal info, absolute local paths or analytics in committed files. Git identity for this repo is the GitHub noreply address.
- Line endings are LF everywhere, enforced by `.gitattributes` (`* text=auto eol=lf`). Set your editor to LF; do not rely on the global `core.autocrlf`.

## Deployment (GitHub Pages)

- `.github/workflows/pages.yml` runs on every push to `main`: `npm ci`, `npm run lint`, `npm test`, `npm run build`, then publishes `dist/`. **A lint error or failing test blocks the deploy.**
- The repo's Pages source must be **"GitHub Actions"** (Settings → Pages). The old "Deploy from a branch" mode would publish the raw source, which cannot run, so do not switch back.
- It needs **GitHub Actions enabled** with "Allow all actions" (or at least actions created by GitHub allowed). Setting Actions to disabled or to "only this account's actions" stops the site from updating. Settings → Pages shows a red banner when this happens.
- Only `dist/` is published, so `CLAUDE.md`, `docs/`, `tests/` and `_template/` are not on the live site.
- To confirm a deploy: `gh run list --workflow pages.yml --limit 1` should show `completed success` for the latest commit, and the live URLs should load.
- The `engines` field in `package.json` is `^22.22.0 || >=24.8.0`, which is what Vitest 5 and html-validate require, and CI runs both minimums. Check `engines` of any new dev dependency before adding it.
- `.github/workflows/ci.yml` runs lint, the tests and a build on every pull request (nothing is deployed from it), on Node `22.22.0`, `24.8.0` (the two minimums in `engines`) and the current 24. A test checks that every minimum in `engines` appears in the matrix, so change both together. `pages.yml` only runs on pushes to `main` (on Node 24), so without `ci.yml` a pull request would never be tested. `commits.yml` is described under Git hooks.
- **Dependabot** (`.github/dependabot.yml`) opens a pull request every week for npm dependencies and for the actions used in the workflows, each grouped into one PR. Dependabot alerts and security updates are on too, so a vulnerable dependency gets its own PR straight away. Before adding any dev dependency, run `npm audit` and avoid ones with unfixable advisories. To update: check that the PR's CI run (lint, tests, build) passed, skim the changelog for Vite or Vitest major versions (they can change config and test behaviour), then merge. Merging to `main` deploys.

## Working here

- Run `npm run lint`, `npm test` and `npm run build` before committing. Check pages with `npm run preview`, look for console errors, and check them at phone (320 to 375 px) and desktop widths: the header bar must be flush with the top and both edges, and the page must not scroll sideways. Check print output as described under Checking print output.
- Commit style is Conventional Commits with the tool as scope, e.g. `feat(macdonald-cards): ...`, `docs(readme): ...` (enforced by the commit-msg hook).
- Commit `package-lock.json` with any dependency change. `dist/` and `node_modules/` are git-ignored.
- Security: report policy is in `SECURITY.md` (GitHub private vulnerability reporting is on). Secret scanning and push protection are on. Wiki and Projects are off.
- This is not medical software. Pages should not make clinical claims; exercises are for use as directed by a vision therapist.
