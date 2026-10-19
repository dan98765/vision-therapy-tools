# Plan: units toggle, matched Hart pair, letter-size calculator

> Not medical advice. This plans changes to practice-chart generators and a sizing calculator, not a clinical protocol.

Three items from [tool-ideas.md](tool-ideas.md), planned together because they touch the same code:

| Idea | What | Effort |
| --- | --- | --- |
| U5 | A global **inches / millimetres** setting that every tool follows | M |
| P3 | **Matched Hart Pair**: a small chart and a large chart with the same letters | S |
| P4 | **Letter Size Calculator**: viewing distance, visual angle and letter height | S |

## Order, and what ships when

1. **This plan** (docs only).
2. **U5 units toggle**, in one commit, because a header control that only some pages obey would be wrong. It changes the three existing tools and sets up what the two new ones use.
3. **P3 Matched Hart Pair**, a new exercise that reuses the Hart chart's grid and drawing code, which moves into `shared/`.
4. **P4 Letter Size Calculator**, a new exercise, plus an optional link from its result into the chart and card pages.

Each ships as its own commit after lint, tests, build and real-browser checks (and print checks where sizes change).

## U5. Units toggle

### Decisions

- **Two systems: inches and millimetres.** Inches stays the default, as now. Metric shows millimetres, not centimetres, for lengths in controls and notes. (The calibration ruler is marked in centimetres, as a ruler is.)
- **One control, in the shared header.** A small "Units" select on every page, next to the exercise links. It is the first script on the landing page, so the landing page's Content-Security-Policy gains `script-src 'self'` (and nothing else). The script is added by the header itself, so a new page needs nothing.
- **Kept in the device storage with the other settings**, under its own entry (`vision-therapy-tools:global`), so every page and every later visit sees the same choice. Validated like any saved value; anything but "in" or "mm" is ignored and means inches.
- **The layout maths, tests and CSS stay in millimetres.** Only what the user sees and types changes. The conversion stays at the edge, in `shared/units.js`.
- **Only units for now.** Paper size (Letter/A4), a reduced-motion override and the others on the U5 list stay on the ideas list. Units is the one the user asked for, and each further setting needs its own decision about what it changes.

### How it works

- **Each length control has a definition for both systems**: range, step, default and decimals, in a `lengths.js` beside each page. The metric definitions are the old millimetre sliders (card size 100 to 250 mm, base letter 1 to 6 mm in 0.5 steps, Hart letter height 2 to 30 mm in 0.5 steps), so every step is a tidy number in either system. The HTML keeps the inch definition (so a page works before its script runs), and a test checks the HTML matches the `in` definition.
- **Switching units** rewrites each control's `min`, `max` and `step`, converts the current value through millimetres, snaps it to the new step and keeps it inside the new range.
- **Remembered length values are saved in millimetres**, whatever unit was showing, and converted back on load, so changing units never reinterprets a saved number. This changes what is saved, so `SETTINGS_VERSION` goes to 2 and older saved settings are dropped once (they would otherwise be read as millimetres).
- **Text is unit-aware**: `sizeSummary`, the page-fit note in `shared/paper.js`, the "innermost letters are only ... tall" warning and every readout take the units. The calibration page also rewrites its reference options ("Credit or ID card (long edge, 85.6 mm)"), the custom length box, the "pixels per inch / per millimetre" row, the ruler (inch ticks to 1/16 or centimetre, half-centimetre and millimetre ticks) and its 2 in or 50 mm square.
- **A change in one tab** reaches pages opened later; open pages are updated by the header control on the same page. Cross-tab live sync is not built.

### Tests

- Conversion and snapping: round trip through millimetres, a converted value always lands on a step and inside the range, in both directions, for every length control.
- Each page's HTML attributes equal its `in` definition, and each `mm` definition has a default inside its range and on its step grid.
- Saved lengths in millimetres restore correctly in either unit, ignore out-of-range values, and the version change drops old data.
- Text helpers give the right unit label and decimals; the page-fit warning reads "7.2 × 10.0 in" or "184 × 254 mm".
- The metric ruler's ticks (every millimetre, labelled centimetres) beside the inch ruler's.
- Every page has the units control and the header script, and the landing page's CSP allows only `'self'` scripts.
- Real browser: switching units changes every readout, note and the calibration ruler; a reload keeps the choice; printing a chart gives the same size either way.

### Risks

- **Drift between the two unit definitions** is the main cost. The sync tests exist for that.
- **A saved size that no longer fits** after a unit switch (a metric 250 mm card shown in inches is 9.8 in, fine, but an inch value near an edge may land outside the metric range) is clamped, never dropped, when switching; it is only ignored when restoring something saved earlier.

## P3. Matched Hart Pair

### Decisions

- **A new exercise page, `matched-hart-pair/`**, not a mode of the Hart chart. The Hart chart stays simple.
- **One letter grid, drawn twice**: a small chart to hold in the hand and a large chart for the wall, with identical letters, rows and columns. Size and spacing changes redraw the same letters; rows, columns and letter set make a new grid, as on the Hart chart.
- **Controls:** rows, letters per row, letter set, spacing, row numbers, column numbers, the small chart's letter height, and a **size ratio** for the large chart (1.5 to 6 times the small letters, default 2). The large chart's height is shown beside the slider.
- **A large chart that does not fit a page is allowed, with the same warning as the Hart chart**, not blocked and not tiled. A wall chart is often larger than a page by nature. Tiling across pages stays on the ideas list.
- **Each chart has its own note** (size, page fit) and its own print button. "Print small chart" and "Print large chart" print one chart; the browser's own Print prints both, each on its own page.
- **Shared code moves into `shared/`:** the letter-grid maths (`hart-chart/grid.js` becomes `shared/hart-grid.js`) and a function that draws a chart into a box (`shared/hart-draw.js`), so the two pages cannot drift. Tests and notes follow the move.

### Tests

- Both charts hold exactly the same letters in the same places.
- The large chart's layout is the ratio times the small one's, at the same rows, columns, spacing and numbers.
- Page-fit notes for each chart, including one that only fits sideways.
- The page checks (CSP, labels, header, landing page, README, notes file, remembered settings, no background colours in print).
- Real browser and print checks: the same letters in both charts after resizing, each print button prints only its chart, and the page count and sizes on Letter and A4.

## P4. Letter Size Calculator

### Decisions

- **A new page, `letter-size-calculator/`**, with three linked quantities and a choice of which to work out: **letter height**, **viewing distance** or **visual angle**. The two that are not being solved are typed in; the solved one is shown and cannot be typed in.
- **Maths:** height = 2 × distance × tan(angle ÷ 2), and its two rearrangements, in `letter-size-calculator/angle.js` with no DOM access. The angle can be entered in **minutes of arc or degrees** and the result is shown in both.
- **Height means cap height**, as everywhere else in the repo. The page also shows the font size an Arial letter of that cap height needs (height ÷ 0.716).
- **No acuity ratings.** Results are plain angles and lengths. The page does not name a Snellen fraction or say what any size means for someone's vision.
- **Units follow the global setting**: height and distance in inches or millimetres.
- **Link into the other tools.** The result offers "Use this letter height" links to the Hart chart, the matched pair (small chart) and the cards. The link carries only a length in millimetres (`?letter-mm=6.35`). The receiving page validates it, keeps it inside its slider's range (and says when it had to adjust it), and uses it in place of the remembered height. Nothing else travels in a link.
- **Remembered like every page**: the controls are saved on the device and there is a Reset settings button.

### Tests

- The three formulas, a round trip in each direction, both angle units, and awkward inputs (zero, negative, very large angles, angles near the limit of the formula).
- The link: a good value passes through, junk, negative, zero, huge and repeated values are ignored, and a value outside a slider's range is clamped to it.
- The page checks, and a real-browser check: solving each of the three ways, switching units and angle units, following a link into each chart page.

## Not in this round

- Tiling a large chart across several pages.
- Paper size, a reduced-motion override and interface-size settings (the rest of U5).
- Viewing-distance links between the pair and the calculator beyond the letter-height link.
