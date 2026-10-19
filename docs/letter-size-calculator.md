# Letter Size Calculator

Notes and documentation for `letter-size-calculator/`.

> Not medical advice. This page is a calculator for sizes and angles. It does not say what any size means for someone's vision, and it does not name acuity ratings.

## What it is

Practice letters are usually described by how big they look, not by how tall they are: a letter that spans a given **visual angle** at a given **viewing distance**. Turning that into a printed height is a little trigonometry that nobody wants to do by hand. This page does it, in either direction:

- **Letter height** from a viewing distance and a visual angle
- **Viewing distance** from a letter height and a visual angle
- **Visual angle** from a letter height and a viewing distance

The result can be sent to the Hart chart, the matched Hart pair and the Macdonald cards as their letter height.

## How the maths works

A letter of height *h* seen from distance *d* spans the angle `angle = 2 x atan(h / (2d))`, so `h = 2 x d x tan(angle / 2)` and `d = h / (2 x tan(angle / 2))`. This is the standard geometry of a flat object facing the eye; the page does not model the eye. Angles are entered in **minutes of arc** (the default; 60 to a degree) or **degrees**, and the result shows both.

- **Height means cap height**, the height of a capital letter, as on every page of this site. The page also shows the font size an Arial letter of that cap height needs (cap height divided by 0.716, from `CAP_HEIGHT` in `shared/letters.js`).
- **Lengths follow the Units control** in the header (inches or millimetres).
- **No acuity ratings.** Results are plain lengths and angles. The page does not label anything with a Snellen fraction or say what a size is "for".

## How the tool works

### Where the code lives

| File | What it does |
| --- | --- |
| `index.html` | Markup only: the choice of what to work out, three boxes, the result, the links |
| `main.js` | Reads the boxes, works out the answer, shows it, builds the links |
| `angle.js` | The maths: the three formulas, angle unit conversion, the limits, and reading a saved angle back. No DOM access, so it is tested |
| `lengths.js` | The height and distance boxes, as definitions for inches and for millimetres |
| `remembered.js` | The controls remembered between visits |
| `../shared/prefill.js` | The link format and parsing (`?letter-mm=`), shared with the pages that receive it |
| `../tests/letter-size-calculator.test.js`, `../tests/prefill.test.js` | The maths, the page agreeing with it, and the link |

### Settings

| Control | Meaning |
| --- | --- |
| Work out the | Which quantity is the answer: letter height (default), viewing distance or visual angle. The other two are typed in; the answer box has a dashed edge and cannot be typed in |
| Write angles in | Minutes of arc (default) or degrees. Changing it converts the angle box |
| Letter height | 0.01 to 24 in, or 0.25 to 600 mm (default 0.14 in or 3.5 mm) |
| Viewing distance | 4 to 600 in, or 100 to 15,000 mm (default 16 in or 400 mm) |
| Visual angle | 0.5 to 600 minutes of arc, or 0.01 to 10 degrees (default 30 minutes of arc) |

The defaults describe a letter of about 30 minutes of arc at 16 in (40 cm): about 0.14 in (3.5 mm) tall.

### Behavior

- **It works as you type.** The answer updates on every change. A value that is missing or outside a box's range gives a message under the boxes and "—" in the result, never a wrong number.
- **The answer is not limited to the typing ranges.** A very small angle at a large letter gives a very long distance, which is shown as it is.
- **The angle is kept in minutes of arc**, whichever way it is written, because its allowed range depends on the unit. The other boxes are remembered like every page's settings (`remembered.js`), with lengths saved in millimetres.
- **The links** under "Use this letter height" carry only the height, in millimetres, as `?letter-mm=6.350`. The receiving page checks it strictly (a plain positive number up to 1,000 only), puts it in its letter-height control, keeps it inside that control's range (and says so when it had to move it), saves it as that page's setting, and takes it out of the address so a reload does not undo later changes. See `shared/prefill.js`.

### Ideas for later

- Show the viewing distance in feet as well, for wall charts
- Link the matched pair's large chart to a viewing distance, so its size follows from how far away it hangs
- Common angles as shortcuts (without naming what they mean)

## Legal notes

The geometry is standard and not protected. Code in this repo is MIT licensed (see `LICENSE`). This is not legal advice.

## Sources

The formula is the standard relation between an object's size, its distance and the angle it subtends. No clinical source is used or needed, and none of the numbers here is a clinical value; the defaults are only a convenient starting point.
