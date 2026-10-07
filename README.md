# Vision Therapy Tools

Small vision therapy exercises as standalone browser pages. No install, no build: open the HTML file.

**Live site:** <https://dan98765.github.io/vision-therapy-tools/>

## Tools

| Tool | Description |
| --- | --- |
| [Macdonald Form Field Cards](macdonald-form-field-cards/index.html) ([notes](docs/macdonald-form-field-cards.md)) | Printable concentric-ring letter cards for peripheral awareness and form recognition practice, laid out in mm for true-size printing. |
| [Hart Chart Generator](hart-chart/index.html) ([notes](docs/hart-chart.md)) | Printable rows of random letters for saccade and near-far focusing practice, laid out in mm for true-size printing. |

## Adding an exercise

1. Copy `_template/` to a new kebab-case folder.
2. Edit its `index.html`.
3. Add a card to the root `index.html` and a row to the table above.
4. Add a notes file in `docs/`.

See [CLAUDE.md](CLAUDE.md) for project conventions.

## Security

The pages are static, make no network requests and store nothing. To report a problem, see [SECURITY.md](SECURITY.md).

## Disclaimer

These tools are not medical devices or medical advice. Use exercises as directed by your vision therapist.

## License

MIT, see [LICENSE](LICENSE).
