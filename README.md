# Vision Therapy Tools

Small vision therapy exercises as browser pages. Plain HTML, CSS and vanilla JavaScript, built with [Vite](https://vite.dev) and tested with [Vitest](https://vitest.dev). Nothing is sent or stored.

**Live site:** <https://dan98765.github.io/vision-therapy-tools/>

## Tools

| Tool | Description |
| --- | --- |
| [Macdonald Form Field Cards](https://dan98765.github.io/vision-therapy-tools/macdonald-form-field-cards/) ([code](macdonald-form-field-cards/), [notes](docs/macdonald-form-field-cards.md)) | Printable concentric-ring letter cards for peripheral awareness and form recognition practice, laid out in mm for true-size printing. |
| [Hart Chart Generator](https://dan98765.github.io/vision-therapy-tools/hart-chart/) ([code](hart-chart/), [notes](docs/hart-chart.md)) | Printable rows of random letters for saccade and near-far focusing practice, laid out in mm for true-size printing. |

## Running it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev       # dev server with hot reload
npm test          # run the tests
npm run build     # build to dist/
npm run preview   # serve the built site
```

The built pages are ES modules, so opening an `index.html` straight from disk does not work. Use the dev server, preview, or the live site.

## Adding an exercise

1. Copy `_template/` to a new kebab-case folder next to it.
2. Put the maths in its own file and add a test in `tests/`.
3. Add a card to the root `index.html` and a row to the table above.
4. Add a notes file in `docs/`.

New exercise folders are picked up by the build automatically. See [CLAUDE.md](CLAUDE.md) for project conventions.

## Deployment

Every push to `main` runs the tests, builds the site and publishes it with GitHub Pages (`.github/workflows/pages.yml`). A failing test blocks the deploy. Pull requests run the tests and a build too (`.github/workflows/ci.yml`), and Dependabot opens weekly pull requests for dependency updates.

## Security

The pages make no network requests, store nothing, and ship a strict Content-Security-Policy. To report a problem, see [SECURITY.md](SECURITY.md).

## Disclaimer

These tools are not medical devices or medical advice. Use exercises as directed by your vision therapist.

## License

MIT, see [LICENSE](LICENSE).
