# Hart Chart Generator

Notes and documentation for `hart-chart/`.

> Not medical advice. This page describes a vision therapy exercise for background only. Use it as directed by a vision therapist.

## What the exercise is

A Hart chart is a grid of letters (sometimes numbers or symbols) in rows. It is used in vision therapy for:

- **Saccades:** quick, accurate jumps of the eyes from one letter to the next
- **Near-far focusing (accommodative flexibility):** shifting focus between a small chart held close and a large chart on a wall

## How it is commonly used

Descriptions from therapy sources, which this repo does not endorse as a protocol or claim are effective (the exact routine always comes from the supervising therapist):

- A large chart is taped to a wall at eye level, and the person sits or stands several feet away (sources mention 6 to 10 feet). A smaller chart with the same letters is held in the hand.
- **Near-far:** read a letter or line from the near chart, then shift to the far chart and read the matching letter, and alternate. A letter should be clear before moving on. This is often done with one eye covered.
- **Saccades only:** use just the wall chart. Read the two outer columns, alternating one letter at a time between them, then move inward column by column.
- **Making it harder:** a farther wall chart, a nearer hand chart, more speed, or adding a rhythm.

## History

TODO: the research behind this page did not find who developed the chart or when, so no history is claimed here. Add it once a primary source is found.

## How the tool works

The page generates a chart of random letters, laid out internally in millimetres (the page shows inches) so it prints at true size at 100% scale. To make a **large** chart for the wall and a **small** chart for the hand, generate twice with different letter heights. Keep the same row and column counts so the two charts line up. Row and column numbers help keep your place. The default chart (10 rows of 10 letters, 0.2 in tall) is about 7.0 x 5.6 in and fits one page; with row numbers it is about 8.1 in wide and needs a sideways page.

### Where the code lives

| File | What it does |
| --- | --- |
| `index.html` | Markup only: controls, buttons, the chart container |
| `main.js` | Reads the controls, draws the chart, writes the note under the buttons |
| `grid.js` | The maths: building the letter grid (no repeated neighbours) and the chart size. No DOM access, so it is tested |
| `style.css` | Chart, cell and row-number styles, plus print overrides |
| `../shared/` | Styles and helpers shared with other exercises, including `paper.js` (will it fit a Letter/A4 page, and what to tell the user) |
| `../tests/hart-grid.test.js` | Checks the grid builder and size calculations |
| `../tests/paper.test.js` | The page-fit logic behind the note about printing |
| `../tests/pages.test.js` | Checks the page against the project conventions, including that its CSS does not depend on background colours |

### Settings

| Control | Meaning |
| --- | --- |
| Rows | Number of lines of letters (4 to 24, default 10) |
| Letters per Row | Letters in each line (4 to 16, default 10) |
| Letter Height | Capital-letter height in inches (0.08 to 1.2 in 0.02 steps, default 0.2) |
| Spacing | Cell width as a multiple of the font size (1.5 to 4, default 2.5); row height is 0.8 of that |
| Letter Set | Uppercase or lowercase, all letters or consonants only (default uppercase, all letters) |
| Show row numbers | Numbers each row on both sides (off by default) |
| Show column numbers | Numbers each column above and below (off by default). It adds two rows of height, so a tall chart may need more room |

### Behavior

- **Random letters never repeat next to each other.** A letter is never the same as the one to its left or the one above it, so every eye jump lands on a different letter.
- **Consonants only** avoids accidentally spelling words.
- **Size and spacing sliders keep the same letters.** Changing rows, letters per row or letter set makes a new chart, and "Generate Chart" always makes a new one. This split (redraw vs regenerate) is deliberate; keep it when changing the code.
- **Size warning.** A note under the buttons shows the chart's size in inches and how it will print (limits from `shared/paper.js`: about 7.2 x 10 in upright, which is Letter or A4 with 0.5 in margins; larger print margins will clip). A chart that only fits a sideways page says "Print in landscape.". A chart that is narrow enough but taller than a page says it continues onto more pages (in landscape if it is wider than 7.2 in); rows are kept whole (`break-inside: avoid`), so no row is split across a page break. A chart too wide for either orientation turns amber, because it would be cut off, and so does one with letters under 1.5 mm tall. The chart is still drawn.
- **Letter height is cap height** (about 0.716 of the font size for Arial), including for lowercase letters, so lowercase letters look smaller than uppercase at the same setting.
- **On-screen size is approximate**, because CSS `mm` is exact in print but screens vary. A chart wider than the window scrolls sideways.

### Ideas for later

- Print a matching large and small pair in one click
- Choose letter size by visual angle at a given viewing distance
- Number and symbol sets
- Seeded randomness so a chart can be regenerated or shared
- Multi-page tiling for wall-size charts. Today a tall chart continues onto more pages row by row, but one wider than a page is cut off

## Legal notes

The exercise is a method, which copyright does not protect, and the page generates its own random letters. Commercial printed charts are copyrighted by their publishers, so do not copy them. Code in this repo is MIT licensed.

## Sources

- [Vision therapy: A top 10 must-have list (Optometry Times)](https://www.optometrytimes.com/view/vision-therapy-top-10-must-have-list)
- [Vestibular First: Hart chart](https://vestibularfirst.com/?p=22780)
