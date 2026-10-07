# Vision Therapy Tools

A collection of small, single-purpose vision therapy exercises that run as plain browser pages. No build step, no dependencies, no backend. Open the HTML file and it works.

## Layout

- `index.html` — currently the Macdonald Form Field Cards generator (the first tool; background in `docs/macdonald-form-field-cards.md`). Intended to move to `macdonald-form-field-cards/` once there is a second tool and a landing page.
- `_template/index.html` — starting point for a new exercise. Copy it, don't edit it.
- Each new exercise lives in its own folder: `<exercise-name>/index.html`, kebab-case.

## Conventions

- **One self-contained HTML file per exercise**: inline `<style>` and `<script>`, no external CDNs, fonts or network requests. It must work offline and from `file://`.
- **Vanilla JS only.** No frameworks, bundlers or npm. If a tool seems to need one, stop and ask.
- **Match the existing look** of `index.html`: system font stack, `#f0f2f5` page background, white rounded control panel, `#2563eb` accent, sections separated by `/* ── Name ── */` comment banners.
- **Controls are obvious**: sliders/selects with a visible value readout, sensible defaults so the page is useful on first load. Prefer redrawing live on input; where output is random (as in the Form Field Cards generator) an explicit Generate button is acceptable so a card doesn't change while adjusting sliders.
- **Printable exercises** (cards, charts) need an `@media print` stylesheet that hides the controls and prints only the exercise at true size.
- **Interactive exercises** (timers, moving targets) need a clear start/stop, must respect `prefers-reduced-motion`, and should not flash faster than 3 Hz.
- **Accessibility basics**: real `<label>`s tied to inputs, keyboard operable, adequate contrast. Exercise content may need to be large and high-contrast by design.
- Physical size matters for these exercises (viewing distance, letter size). Where size is meaningful, offer units the user can calibrate (e.g. mm/in) rather than only abstract pixels.

## Gotchas

- `index.html` lays out the card in mm (true size when printed at 100%). Letters are auto-shrunk to fit, and `BORDER_MM` in the JS must match the `.card` border in the CSS. See "How layout works" in `docs/macdonald-form-field-cards.md` before changing placement logic.
- Every page has a "not medical advice" footer (`.disclaimer`) that is hidden in `@media print`. Keep it when copying `_template/`.
- Every page has a Content-Security-Policy `<meta>` that blocks all network access (`default-src 'none'`), allowing only inline styles and scripts. Keep it when copying `_template/`. If a tool genuinely needs something more (e.g. `img-src data:` for a canvas export), widen only that directive. A meta CSP cannot set `frame-ancestors`.
- The repo is public: no personal info, absolute local paths or analytics in committed files. Git identity for this repo is the GitHub noreply address.

## Working here

- Test by opening the page in a browser (the in-app browser or `start index.html`). Check the console for errors and try print preview for printable tools.
- Commit style is Conventional Commits with the tool as scope, e.g. `feat(macdonald-cards): ...`, `docs(readme): ...`.
- Keep the README tool list in sync when adding or renaming an exercise.
- This is not medical software. Pages should not make clinical claims; exercises are for use as directed by a vision therapist.
