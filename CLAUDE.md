# Vision Therapy Tools

A collection of small, single-purpose vision therapy exercises that run as browser pages. Plain HTML, CSS and vanilla JavaScript, built with Vite and tested with Vitest. No backend, no UI framework, no third-party code at runtime. Published with GitHub Pages.

## Commands

```bash
npm install        # once
npm run dev        # dev server with hot reload (http://localhost:5173)
npm test           # run the Vitest tests once
npm run build      # build to dist/
npm run preview    # serve dist/ locally (http://localhost:4173), the closest thing to the live site
```

The built pages use ES modules, so **opening a file from disk (`file://`) does not work**. Use `npm run dev` or `npm run preview`, or the live site: https://dan98765.github.io/vision-therapy-tools/

## Layout

- `index.html`, `landing.css` — landing page listing every exercise. **Add a card here for each new exercise.** It has no script, so its CSP omits `script-src`.
- `macdonald-form-field-cards/` — Macdonald Form Field Cards (notes in `docs/macdonald-form-field-cards.md`).
- `hart-chart/` — Hart Chart generator (notes in `docs/hart-chart.md`).
- Each exercise folder holds `index.html` (markup only), `style.css`, `main.js` (reads controls, draws), and a file of pure maths with no DOM access (`layout.js`, `grid.js`) that the tests import.
- `shared/` — code and CSS used by every exercise: `style.css`, `letters.js` (letter pools, shuffle, cap-height and minimum-size constants), `format.js` (text for the size note), `page.js` (small DOM helpers).
- `tests/` — Vitest tests (`*.test.js`) plus `rng.js`, a seeded random generator so failures are repeatable.
- `docs/` — one notes file per exercise (what it is, how it is used, how the page works, gotchas, sources), plus `brainstorm-structure.md`, the options considered when choosing this build setup.
- `_template/` — starting point for a new exercise. Copy it, don't edit it.
- `vite.config.js` — builds the root `index.html` and every top-level folder that has an `index.html`, except folders starting with `_` or `.` and `node_modules`, `dist`, `docs`, `shared` and `tests`. A new exercise needs no config change.

## Adding an exercise

1. Copy `_template/` to a new kebab-case folder next to it (the template's `../shared/` paths expect that depth).
2. Put the maths in its own file and add a test in `tests/`.
3. Add a card to the root `index.html`, a row to the README table, and a notes file in `docs/`.
4. Run `npm test` and `npm run build`, then check the page with `npm run preview`.

## Conventions

- **Vanilla JS and CSS.** No UI framework. Vite and Vitest are the only dependencies and both are dev-only. If a tool seems to need another dependency, stop and ask.
- **No network requests at runtime**: no CDNs, remote fonts or analytics. Everything is bundled from this repo.
- **Keep `index.html` to markup.** CSS goes in `style.css`, behaviour in `main.js`, testable maths in a separate file. Do not add inline `<style>`, `<script>` or `style=""` attributes, because the CSP forbids them. Setting `element.style.x = ...` from JavaScript is fine.
- **Put shared things in `shared/`**, not copied into pages. Do not rely on CSS order: Vite emits page CSS before shared CSS, so a page rule that needs to override a shared rule must be more specific, not just later.
- **Match the existing look** of the other exercises: system font stack, `#f0f2f5` page background, white rounded control panel, `#2563eb` accent, sections separated by `/* ── Name ── */` comment banners.
- **Controls are obvious**: sliders and selects with a visible value readout, sensible defaults so the page is useful on first load. Prefer redrawing live on input; where output is random an explicit Generate button is acceptable so the result doesn't change while adjusting sliders (the Hart chart redraws the same letters for size changes and regenerates for the rest).
- **Printable exercises** (cards, charts) need an `@media print` stylesheet that hides the controls and prints only the exercise at true size.
- **Interactive exercises** (timers, moving targets) need a clear start/stop, must respect `prefers-reduced-motion`, and should not flash faster than 3 Hz.
- **Accessibility basics**: real `<label>`s tied to inputs, keyboard operable, adequate contrast. Exercise content may need to be large and high-contrast by design.
- Physical size matters for these exercises (viewing distance, letter size). Where size is meaningful, use mm (CSS `mm` is true size in print) rather than abstract pixels.
- **Relative links and paths only.** The site is served from a subpath on GitHub Pages, so `/something` links would break. Exercise pages link back with `<a class="back" href="../">`. Vite is configured with `base: './'`.

## Gotchas

- `macdonald-form-field-cards/layout.js` lays out the card in mm (true size when printed at 100%). Letters are auto-shrunk to fit. The border width has a single source, `BORDER_MM`, which `main.js` passes to the CSS as `--border-mm`. See "How layout works" in `docs/macdonald-form-field-cards.md` before changing placement logic.
- Letter sizes in the UI are **cap heights** in mm, converted with `CAP_HEIGHT` in `shared/letters.js`.
- Every page has a "not medical advice" footer (`.disclaimer`) that is hidden in `@media print`. Keep it when copying `_template/`.
- Every page has a Content-Security-Policy `<meta>` that blocks all network access (`default-src 'none'`) and allows only scripts and styles from the site itself (`'self'`). Keep it when copying `_template/`. If a tool genuinely needs something more (e.g. `img-src data:` for a canvas export), widen only that directive. A meta CSP cannot set `frame-ancestors`. The dev server adds one extra `connect-src` for its hot-reload websocket (see `vite.config.js`); built pages do not have it.
- The tests in `tests/cards-layout.test.js` check every combination of card settings for clipping and overlap using each letter's ink box. If you change spacing constants and that test fails, believe the test.
- The repo is public: no personal info, absolute local paths or analytics in committed files. Git identity for this repo is the GitHub noreply address.
- Line endings are LF everywhere, enforced by `.gitattributes` (`* text=auto eol=lf`). Set your editor to LF; do not rely on the global `core.autocrlf`.

## Deployment (GitHub Pages)

- `.github/workflows/pages.yml` runs on every push to `main`: `npm ci`, `npm test`, `npm run build`, then publishes `dist/`. **A failing test blocks the deploy.**
- The repo's Pages source must be **"GitHub Actions"** (Settings → Pages). The old "Deploy from a branch" mode would publish the raw source, which cannot run, so do not switch back.
- It needs **GitHub Actions enabled** with "Allow all actions" (or at least actions created by GitHub allowed). Setting Actions to disabled or to "only this account's actions" stops the site from updating. Settings → Pages shows a red banner when this happens.
- Only `dist/` is published, so `CLAUDE.md`, `docs/`, `tests/` and `_template/` are not on the live site.
- To confirm a deploy: `gh run list --workflow pages.yml --limit 1` should show `completed success` for the latest commit, and the live URLs should load.
- The `engines` field in `package.json` says Node 20 or newer; the workflow uses Node 22.
- `.github/workflows/ci.yml` runs the tests and a build on every pull request (nothing is deployed from it). `pages.yml` only runs on pushes to `main`, so without `ci.yml` a pull request would never be tested.
- **Dependabot** (`.github/dependabot.yml`) opens a pull request every week for npm dependencies and for the actions used in the workflows, each grouped into one PR. Dependabot alerts and security updates are on too, so a vulnerable dependency gets its own PR straight away. To update: check that the PR's CI run passed, skim the changelog for Vite or Vitest major versions (they can change config and test behaviour), then merge. Merging to `main` deploys.

## Working here

- Run `npm test` and `npm run build` before committing. Check pages with `npm run preview`, look for console errors, and try print preview for printable tools.
- Commit style is Conventional Commits with the tool as scope, e.g. `feat(macdonald-cards): ...`, `docs(readme): ...`.
- Commit `package-lock.json` with any dependency change. `dist/` and `node_modules/` are git-ignored.
- Security: report policy is in `SECURITY.md` (GitHub private vulnerability reporting is on). Secret scanning and push protection are on. Wiki and Projects are off.
- This is not medical software. Pages should not make clinical claims; exercises are for use as directed by a vision therapist.
