# Matched Hart Pair

Notes and documentation for `matched-hart-pair/`.

> Not medical advice. This page describes a vision therapy exercise for background only. Use it as directed by a vision therapist.

## What the exercise is

The same near-far exercise as the [Hart chart](hart-chart.md): a small chart held close and a large chart on a wall, with the **same letters in the same places**, so that moving the eyes from one chart to the other lands on the matching letter. The Hart chart page makes one chart at a time, so making a matching pair there means generating twice and hoping the letters agree. This page makes both from one grid.

How the exercise is commonly used, and where that description comes from, is on the Hart chart notes. This repo does not endorse it as a protocol or claim it is effective; the routine always comes from the supervising therapist.

## How the tool works

The page builds one random letter grid and draws it twice: a **small chart** at the letter height you choose, and a **large chart** whose letters are a chosen number of times taller. Both have the same rows, letters per row, spacing, letter set and numbers, so the large chart is the small chart with every cell bigger. Everything is laid out in millimetres so it prints at true size at 100% scale; the page shows inches or millimetres as the Units control in the header says.

### Where the code lives

| File | What it does |
| --- | --- |
| `index.html` | Markup only: controls, buttons, and a box for each chart |
| `main.js` | Reads the controls, draws both charts, writes a note under each title, runs the two print buttons |
| `pair.js` | The maths: the size ratio's limits and both charts' layouts from one set of settings. No DOM access, so it is tested |
| `lengths.js` | The small chart's letter height, as a definition for inches and for millimetres |
| `remembered.js` | The controls remembered between visits |
| `style.css` | The titles, and the print rules that choose which chart prints |
| `../shared/hart-grid.js` | The letter grid (no repeated neighbours) and the layout of one chart, shared with the Hart chart page |
| `../shared/hart-draw.js` | Draws a chart into a box, shared with the Hart chart page |
| `../shared/chart.css` | The chart's own styles and print overrides, shared with the Hart chart page |
| `../tests/matched-hart-pair.test.js` | Checks the pair's layouts and that the page agrees with the maths |

### Settings

| Control | Meaning |
| --- | --- |
| Rows | Number of lines of letters (4 to 24, default 10) |
| Letters per Row | Letters in each line (4 to 16, default 10) |
| Small Chart Letter Height | Capital-letter height of the small chart: 0.08 to 0.5 in in 0.02 steps (default 0.16 in), or 2 to 12 mm in 0.5 steps (default 4 mm) |
| Large Chart Size | How many times taller the large chart's letters are: 1.25 to 6 in steps of 0.25 (default 1.5). The readout shows the large chart's letter height |
| Spacing | Cell size as a multiple of the letter size (1.5 to 4, default 2.5) |
| Letter Set | Uppercase or lowercase letters, or consonants only |
| Show row numbers, Show column numbers | Numbers the rows on both sides and the columns above and below (off by default) |

"Generate Pair" makes a new grid. **Print small chart** and **Print large chart** print one chart; the browser's own Print prints both, each on its own page.

### Behavior

- **Both charts always hold the same letters.** Changing rows, letters per row or the letter set makes a new grid for both; sizes, spacing and numbers redraw the same letters.
- **Each chart has its own note** under its title: its size, how it will print, and a warning if it is too big for a page or its letters are too small to read (the same page-fit logic as the Hart chart, from `shared/paper.js`).
- **A large chart that does not fit a page is allowed, with the warning.** The default ratio of 1.5 keeps a default pair printable (the small chart upright, the large one sideways). A real wall chart is usually bigger than a page; raise the ratio and print it somewhere that can print larger sheets, or accept the warning. Tiling a big chart across several pages is not built.
- **One print button hides the other chart.** `Print small chart` sets a `data-print` attribute on the page for the print and removes it afterwards; the print rules in `style.css` then hide the other chart. Without it (the browser's own Print), the large chart starts a new page.
- **Letter height is cap height**, as everywhere on this site.
- **On-screen size is approximate**, because CSS `mm` is exact in print but screens vary. A chart wider than the window scrolls sideways.

### Remembered settings

The controls are remembered on this device and come back when the page is opened again; the letters are not kept. **Reset settings** clears them. See the Hart chart notes for how a saved value that no longer fits is ignored.

### Ideas for later

- Link the two charts by viewing distance, so the large chart's size follows from how far away it hangs (the letter-size calculator already works out a height from a distance)
- Tiling a large chart across several pages

## Legal notes

The exercise is a method, which copyright does not protect, and the page generates its own random letters. Commercial printed charts are copyrighted by their publishers, so do not copy them. Code in this repo is MIT licensed (see `LICENSE`). This is not legal advice.

## Sources

See the [Hart chart notes](hart-chart.md#sources).
