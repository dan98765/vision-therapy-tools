# Vision Therapy Tools

Small vision therapy exercises as browser pages. Plain HTML, CSS and vanilla JavaScript, built with [Vite](https://vite.dev) and tested with [Vitest](https://vitest.dev). Nothing is sent or stored.

**Live site:** <https://dan98765.github.io/vision-therapy-tools/>

## Tools

| Tool | Description |
| --- | --- |
| [Macdonald Form Field Cards](https://dan98765.github.io/vision-therapy-tools/macdonald-form-field-cards/) ([code](macdonald-form-field-cards/), [notes](docs/macdonald-form-field-cards.md)) | Printable concentric-ring letter cards for peripheral awareness and form recognition practice, laid out for true-size printing, with sizes in inches. |
| [Screen Calibration](https://dan98765.github.io/vision-therapy-tools/screen-calibration/) ([code](screen-calibration/), [notes](docs/screen-calibration.md)) | A utility: match a credit card or paper to the screen to find how many pixels make a real millimetre, with a ruler to check it. Stores nothing. |
| [Hart Chart Generator](https://dan98765.github.io/vision-therapy-tools/hart-chart/) ([code](hart-chart/), [notes](docs/hart-chart.md)) | Printable rows of random letters for saccade and near-far focusing practice, laid out for true-size printing, with sizes in inches. |

More exercises are being considered: see [docs/tool-ideas.md](docs/tool-ideas.md).

## Running it locally

You need [Node.js](https://nodejs.org) 22.22 or newer (or 24.8 or newer).

```bash
npm install
npm run dev       # dev server with hot reload
npm run lint      # lint the JavaScript, CSS and HTML
npm test          # run the tests
npm run build     # build to dist/
npm run preview   # serve the built site
```

`npm install` also enables the git hooks (via [husky](https://typicode.github.io/husky/)): commits are checked for Conventional Commits messages, a GitHub noreply author email, personal paths, emails or keys in the added lines, lint and tests, and a push re-runs lint, tests and a build.

The built pages are ES modules, so opening an `index.html` straight from disk does not work. Use the dev server, preview, or the live site.

## Adding an exercise

1. Copy `_template/` to a new kebab-case folder next to it.
2. Put the maths in its own file and add a test in `tests/`.
3. Add a card to the root `index.html` and a row to the table above.
4. Add a notes file in `docs/`.

New exercise folders are picked up by the build automatically, and the header bar links to them from their page title. See [CLAUDE.md](CLAUDE.md) for project conventions.

## Deployment

Every push to `main` runs the linters and tests, builds the site and publishes it with GitHub Pages (`.github/workflows/pages.yml`). A lint error or failing test blocks the deploy. Pull requests run the linters, tests and a build too (`.github/workflows/ci.yml`, on the minimum and current Node versions), and a separate check (`.github/workflows/commits.yml`) verifies commit messages and the owner's commit email. Dependabot opens weekly pull requests for dependency updates.

## Security

The pages make no network requests, store nothing, and ship a strict Content-Security-Policy. To report a problem, see [SECURITY.md](SECURITY.md).

## Disclaimer

These tools are not medical devices or medical advice. Use exercises as directed by your vision therapist.

## License

MIT, see [LICENSE](LICENSE).
