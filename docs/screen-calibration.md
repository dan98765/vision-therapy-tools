# Screen Calibration

Notes and documentation for `screen-calibration/` and the maths in `shared/calibration.js`.

> Not medical advice. This is a utility for making on-screen sizes closer to real sizes. It is not a measuring instrument and not a test of anything about the person using it.

## What it is for

Browsers define one CSS inch as 96 CSS pixels, but a real screen rarely matches that, so a box styled `85.6mm` is seldom 85.6 mm wide on the glass. Printed exercises in this repo do not have the problem, because print is exact. On-screen exercises that depend on real size (how big a target is, how fast it moves in degrees, how far apart two targets are) need to know how many pixels make one real millimetre on the screen in front of the person. This tool finds out.

It is a utility, and the first step for the interactive tools listed in [tool-ideas.md](tool-ideas.md).

## How to use it

1. Choose something of known size to measure against: a credit, bank or ID card (3.37 in, or 85.6 mm, along its long edge), a sheet of A4 or US Letter paper (the short edge), or anything else with a length you can enter in millimetres.
2. Hold the object flat against the screen with one edge lined up with the left edge of the on-screen box, and move the slider (or the minus and plus buttons, one pixel at a time) until the other edge lines up with the right edge.
3. Check the result against a ruler: the page draws an inch ruler (marked to 1/16 inch) and a 2 inch square using the calibration. Hold a real ruler against them.

The page then shows pixels per inch and how far an inch in CSS is from a real inch on this screen. Lengths are shown in inches; the maths underneath stays in millimetres.

## Where the code lives

| File | What it does |
| --- | --- |
| `index.html` | Markup only: the reference choice, the slider and box, the results, the check ruler |
| `main.js` | Reads the controls, draws the box and the ruler, shows the results and the note |
| `ruler.js` | The ruler's tick marks in real inches. No DOM access, so it is tested |
| `style.css` | The box, the results list and the scrolling wrappers |
| `../shared/calibration.js` | The maths: pixels per mm, conversions, slider range, the stale-zoom check, plain-language numbers |
| `../tests/calibration.test.js` | The maths, plus checks that the page's wording, limits and slider values agree with the maths |
| `../tests/ruler.test.js` | The tick marks |

## How it works

- The matched width in CSS pixels divided by the real length in millimetres is pixels per millimetre: `pxPerMm(widthPx, referenceMm)`.
- Anything that should be a real length `L` mm is drawn `L x pxPerMm` pixels long: `mmToPx`. Do not use the CSS `mm` unit for it, because that is the browser's assumption, not the screen's.
- Changing the reference keeps the calibration: the box is redrawn at the width the new reference has under the same pixels per millimetre.
- A longer reference is more precise, because one pixel of adjustment is a smaller share of it. The page shows what one pixel changes.
- The pure maths (`shared/calibration.js`, `screen-calibration/ruler.js`) has no DOM access and is covered by tests. The page repeats a few of its facts in the HTML (the wording of each reference, the custom length limits, the slider's starting values), so a test checks the two agree.

## Settings in the page

| Control | Meaning |
| --- | --- |
| Reference | Credit or ID card (long edge, 3.37 in; the card is drawn at its true shape, 3.37 x 2.13 in), A4 paper short edge (8.27 in), US Letter paper short edge (8.5 in), or a custom length |
| Length of your object | Only for the custom reference. 0.5 to 16 in, typed in inches; an empty or invalid box uses 4 in |
| Box width | Slider from half to double the width the browser would assume, in half-pixel steps, plus buttons for one pixel |
| Reset | Back to the browser's own assumption (96 pixels per inch) |

## Gotchas

- **It is valid only for the current browser zoom and display.** Zooming the page, resizing between screens, or dragging the window to another monitor changes the pixel ratio. After you adjust the box, the page watches the device pixel ratio (through a media query, and on window resize) and shows an amber warning if it changes, which covers browser zoom and moving the window to a screen with a different ratio. It cannot see every change, for example a different monitor with the same pixel ratio, so match the box again whenever the setup changes.
- **Nothing is stored.** The value lives only on this page while it is open. A future tool that needs the calibration would need it passed in or stored, which is a deliberate decision (see "Open decision" under U1 in [tool-ideas.md](tool-ideas.md)). The README and `SECURITY.md` say the site stores nothing, so any storage would be opt-in and documented.
- **A card is edge to edge.** Measure the whole width of the card including its rounded corners, not the printed area.
- **Precision is limited.** With a card, one pixel is about 0.3% of the width, and holding an object flat against glass and lining up edges by eye adds more. Expect an accuracy of about a percent or two, not better. For work that needs more, measure on the actual screen.
- **Some screens and browsers scale in ways a page cannot see.** Display scaling set in the operating system is normally included in the pixel ratio, but projectors, mirrored screens and remote desktops may not report their real size.
- **Print.** This page is not meant to be printed, and its panels are hidden when printing.

## Standards used

- A credit, bank or ID card follows the ISO/IEC 7810 ID-1 size: 85.60 x 53.98 mm.
- A4 paper is 210 mm wide, and US Letter is 8.5 in (215.9 mm) wide.

## Ideas for later

- Opt-in remembering on the device, with a clear note that it never leaves the browser, if an interactive tool needs it
- A viewing-distance step, so sizes can be shown as visual angle as well as millimetres
- A vertical check as well as the horizontal one, for screens with non-square pixels
