# Ideas for more tools

A living list of exercises and utilities that could be added to this site. Nothing here is promised or built. Add to it, strike things out, and when work starts on an idea move it into its own `docs/<tool>.md`.

> Not medical advice. These are ideas for browser tools that support exercises set by a vision therapist. This repo makes no claims that any exercise works. The descriptions below come from clinic handouts, vendor pages and a few journal articles, and are not clinical evidence.

## Contents

1. [Summary](#summary)
2. [What every new tool must meet](#what-every-new-tool-must-meet)
3. [Printable generators](#printable-generators)
4. [Interactive tools](#interactive-tools)
5. [Utilities and foundations](#utilities-and-foundations)
6. [Shared building blocks](#shared-building-blocks)
7. [Needs hardware, so probably out of scope](#needs-hardware-so-probably-out-of-scope)
8. [Be careful with these](#be-careful-with-these)
9. [Names, copying and trademarks](#names-copying-and-trademarks)
10. [A possible order](#a-possible-order)
11. [Open questions](#open-questions)
12. [Sources](#sources)

## Summary

Effort is a rough guess, judged against the exercises built so far: **S** about a day, **M** a few days, **L** a week or more.

| # | Tool | Type | Effort | Short description |
| --- | --- | --- | --- | --- |
| P1 | Visual tracing charts | Printable | M | Letters and numbers joined by tangled lines, followed with the eyes |
| P2 | Saccade cards | Printable | S | Target cards for looking back and forth at a set spacing |
| P3 | Matched Hart pair | Printable | S | A large wall chart and a small hand chart with the same letters |
| P4 | Letter-size calculator | Printable | S | Viewing distance and visual angle to letter height in mm |
| P5 | Pursuit pattern sheets | Printable | S | Figure-eights, spirals and waves to follow with the eyes |
| P6 | Fusion and stereogram cards | Printable | M | Paired targets at an exact separation, and cards of two incomplete images used with a pen |
| P7 | Near-point targets | Printable | S | Fine targets and string-bead position guides |
| P8 | Dot cards | Printable | S | Cards of dots at set spacing (needs a source first) |
| P9 | Scanning sheets | Printable | S | Letter cancellation, word search and number grids |
| P10 | Mazes and hidden figures | Printable | S | General visual-spatial puzzles |
| P11 | Random-dot stereograms | Printable | L | Hidden shapes in dot patterns for free viewing or glasses |
| I1 | Smooth pursuit tracker | Interactive | M | A dot moving along chosen paths |
| I2 | Saccade trainer | Interactive | M | Targets that alternate at a chosen rhythm |
| I3 | Hart chart pacer | Interactive | S | Highlights the next letter at a steady tempo |
| I4 | Peripheral awareness trainer | Interactive | M | A fixation target with brief peripheral targets to click |
| I5 | Visual memory flash cards | Interactive | M | Show a pattern briefly, then recreate it |
| I6 | Rep and rest timer | Interactive | S | Sets, repetitions and rest breaks with a tone |
| U1 | Screen calibration | Utility | S | Matches an on-screen box to a credit card to get pixels per mm |
| U2 | Home program sheet | Utility | S | A printable one-page schedule typed by the therapist or parent |
| U3 | Practice log | Utility | M | Records what was done and when (a policy decision) |

## What every new tool must meet

From `CLAUDE.md`, so an idea is costed with these in mind:

- Copy `_template/`. Keep the maths in its own file with tests, and let the page code only read controls and draw.
- Lay out in millimetres. Printable tools must pass the real print check (page count, true size, nothing cut off) on Letter and A4, with default print settings, so no shape may rely on a background colour.
- Use `shared/paper.js` to tell the user when something will not fit a page.
- Moving content needs a clear start and stop, must respect `prefers-reduced-motion`, and must not flash faster than 3 Hz.
- No network requests, no new runtime dependencies, strict CSP. Anything that stores data conflicts with the "stores nothing" statement in the README and `SECURITY.md` and needs a deliberate decision.
- The footer disclaimer stays on every page, and the notes file for the tool states where its description comes from.

## Printable generators

These fit the repo best: they are about exact sizes in millimetres, which the layout and print checks already cover.

### P1. Visual tracing charts

- **What:** a column of letters and a column of numbers, each letter joined to a number by a curved line, with the lines crossing. The person follows each line with their eyes and names the number it ends at. Charts like this are described as activities in practitioner material found in searches, and the Groffman version is a clinical test.
- **Controls:** number of pairs, how winding the lines are, chart size in mm, line thickness and label size, a seed so a chart can be reproduced, and an answer key.
- **Design note:** the Groffman Visual Tracing test (see [names](#names-copying-and-trademarks)) is a published clinical test. A study of it found the standard version too hard for young children: 24% of 1st and 3rd graders followed no line correctly, and a simplified version worked better. So offer few pairs and gentle curves by default. A practitioner write-up found in a search (not reachable when checked, so not linked) suggested more pairs to make it harder and tracing with a finger to make it easier.
- **Maths:** generate smooth paths between fixed endpoints so that crossings are clear and no two lines run close together or on top of each other except where they cross. The unambiguous-line generator is the real work.
- **Print notes:** draw with SVG strokes, which print without "background graphics". Confirm with the print check.
- **Tests:** every letter maps to exactly one number, no two paths come closer than a minimum gap except at crossings, the crossing count stays in range, and the same seed gives the same chart.
- **Risk:** not a test. The page must not score, time against norms, or present itself as an evaluation.

### P2. Saccade cards

- **What:** target cards (letters, numbers or shapes) to place a set distance apart, for looking back and forth. Clinic home programs describe two notes on a wall about shoulder-width apart, and drills that alternate horizontally or vertically for a set time.
- **Controls:** number of targets (2 or 4), target type and size in mm, orientation, and a printed instruction giving the centre-to-centre spacing to use.
- **Print notes:** a shoulder-width spacing is wider than a page, so print each target on its own sheet and print the spacing as an instruction. Page-fit checking comes from `shared/paper.js`.
- **Tests:** target sizes in mm and the page-fit result.

### P3. Matched Hart pair

- **What:** one click produces a large chart for the wall and a small chart for the hand with the same letters and the same rows and columns, as the Hart chart notes describe. Already on the Hart chart's own ideas list.
- **Controls:** the existing Hart settings plus the small chart's letter height.
- **Maths:** build the letter grid once (`buildGrid` already takes a random function) and lay it out twice.
- **Notes:** a wall chart with big letters will not fit a page. Either cap the size to one page, or add tiling across several pages, which is also on the ideas list.
- **Tests:** both charts hold identical letters.

### P4. Letter-size calculator

- **What:** enter a viewing distance and the visual angle the letters should span, and get the letter height in mm. Also the reverse.
- **Maths:** height = 2 x distance x tan(angle / 2), with a round-trip test. Take plain angles in minutes of arc or degrees. Do not label results with acuity ratings.
- **Link to other tools:** offer the result as a starting value for the Hart chart and the cards, for example through a link that carries only a size in the URL.
- **Tests:** unit conversions and the round trip.

### P5. Pursuit pattern sheets

- **What:** printable paths to follow with the eyes: figure-eights, spirals, waves, circles and zigzags, with start markers and direction arrows.
- **Controls:** shape, size, line thickness, number of repeats, direction.
- **Print notes:** strokes only. Check that closed shapes close and that nothing leaves the page.
- **Tests:** geometry stays inside its box.

### P6. Fusion and stereogram cards

Two related kinds of card, both about the exact separation between two images.

- **Fusion target cards.** A pair of matching targets, such as concentric or eccentric circles, printed at an exact separation for fusing the two images, plus a red/green version for people who have matching glasses. A vendor describes paired cards for fusion, convergence and divergence with a central anti-suppression target and alignment marks on the outer rings, and says they are meant to be used with a professional's guidance.
- **Stereogram cards.** A hospital orthoptic leaflet describes a stereogram as two incomplete images that join to make one complete image, and gives a card of three cats, with the features split between the images, as its example. The person holds the card at arm's length, puts a pen just in front of it and slowly brings it closer while watching the pen tip. The background images become double and then the middle two merge, giving a complete centre image. The leaflet says an orthoptist explains and demonstrates the exercise, that not everyone manages it, and that other cards (a bucket, ABC rings) exist. These are not the same as random-dot stereograms (P11).
- **Controls:** the separation in mm, parallel or crossed viewing for the fusion cards, line thickness, the colour pair for the red/green version, and for the stereogram cards a choice of picture (letters, simple shapes) with the split between the two incomplete images.
- **Print notes:** the separation is the whole point, so true size matters most here. Printer colours and glasses vary, which the page cannot control, so say so on the page. Stereogram cards also need printed instructions for the pen distance.
- **Risk:** these are the ideas closest to a prescription, and the leaflet itself says a professional demonstrates the exercise. Every setting should be the user's choice with a neutral starting value, never presented as the right setting for someone. Draw original pictures, and do not copy the cats or any vendor's card layouts or wording.
- **Tests:** exact separations, symmetric pairs, and that the two incomplete images combine into the full picture with nothing missing or doubled.

### P7. Near-point targets

- **What:** a card with a fine target at a stated size for pencil push-up style work, and a printable strip that marks bead positions at chosen distances for a string.
- **Controls:** target type and size, list of distances in cm or inches.
- **Notes:** describe the exercises the way clinic handouts do and give no dosing advice.
- **Tests:** marked positions in mm.

### P8. Dot cards

- **What:** cards with dots at set spacing, named in a list of tools used for eye misalignment. The sources found describe them by name only.
- **Before building:** find a proper description of how they are used, and decide whether a printable version adds anything.

### P9. Scanning sheets

- **What:** letter cancellation (find every copy of the target letters), word searches, and Schulte-style number grids (numbers 1 to 25 in a random grid, found in order). These are general visual-search and attention exercises, not specific to vision therapy.
- **Controls:** grid size, target letters, text size in mm. Offer a printable sheet and a clickable version with a timer.
- **Tests:** target counts, no repeated numbers, every number placed once.

### P10. Mazes and hidden figures

- **What:** general visual-spatial puzzles that could be generated: mazes of chosen difficulty and hidden-figure sheets.
- **Notes:** not specific to vision therapy. Include only if there is demand.
- **Tests:** a maze always has exactly one solution.

### P11. Random-dot stereograms

- **What:** single-image stereograms for free viewing, and left and right pairs or a red/green version, with a hidden shape at a chosen depth. These are a different thing from the stereogram cards in P6. A published protocol uses random-dot software together with optometry visits, for people with reduced stereoacuity and no strabismus.
- **Controls:** shape, depth step, dot size and density, viewing method, seed.
- **Maths and canvas:** needs canvas drawing at print resolution. Exporting an image would require allowing `img-src data:` in the CSP, so prefer printing straight from the page.
- **Tests:** build a pair, compute the disparity back from the dots and check the hidden shape appears. That makes the algorithm testable.
- **Risk:** the published use is clinic-supervised. Eye strain is possible, so keep sessions short and the disclaimer prominent.

## Interactive tools

All of these must start only when the user presses start, offer a stop, and never flash faster than 3 Hz.

### I1. Smooth pursuit tracker

- **What:** a dot that moves along horizontal, vertical, circular, figure-eight or smooth random paths.
- **Controls:** path, speed, dot size and colour, duration, pause and a full-screen mode.
- **Notes:** speed means little without screen calibration (U1) and a stated viewing distance. Start slow.
- **Tests:** the position-at-time function is pure, so test that speed is constant along each path and that paths are continuous.

### I2. Saccade trainer

- **What:** targets that alternate between two or more positions at a chosen rhythm, with an optional metronome tick from the browser's audio, which needs no network.
- **Controls:** positions (left and right, up and down, diagonal), separation, rhythm (capped at 3 changes per second), target type, and an automatic or click-to-advance mode.
- **Tests:** a pure scheduler that says which target is shown at each time.

### I3. Hart chart pacer

- **What:** highlights the next letter in a row or column pattern at a steady tempo, for rhythm work with a Hart chart.
- **Notes:** extends the existing chart. Same limits on tempo.

### I4. Peripheral awareness trainer

- **What:** a central fixation target, optionally with a small task there, and brief targets that appear around it to click or tap.
- **Controls:** how far from the centre, how long each target stays, how many.
- **Notes:** keep flashes brief and infrequent. Results exist only for the session.

### I5. Visual memory flash cards

- **What:** show a pattern for a set time, then ask the person to recreate it on a grid.
- **Notes:** mostly interface work, because the person needs a grid editor.

### I6. Rep and rest timer

- **What:** sets, repetitions and rest breaks with large numbers and a gentle tone, for home programs that describe a number of repetitions or timed sets.
- **Notes:** nothing stored. The browser's wake-lock feature could keep the screen on.

## Utilities and foundations

### U1. Screen calibration

- **What:** the user slides a box until it matches the width of a credit card, which is 85.60 mm wide under the ID-1 card standard, and the page works out pixels per millimetre for that screen.
- **Why:** without it, anything shown at "true size" on screen is only approximate. It is the foundation for the interactive tools.
- **Open decision:** the value must be remembered somewhere between pages. See the questions below about storage.
- **Tests:** the conversion functions.

### U2. Home program sheet

- **What:** the therapist or parent types activities, repetitions and notes, and prints a one-page schedule. Text only.
- **Notes:** no storage and no accounts.

### U3. Practice log

- **What:** a record of what was done and when.
- **Policy decision:** this repo says it stores nothing. A log needs local storage, a clear statement that it never leaves the device, and updates to the README and `SECURITY.md`. Decide it on purpose.

## Shared building blocks

Several ideas would need the same pieces. Building them once, in `shared/` with tests, keeps the tools consistent.

| Piece | Used by | Notes |
| --- | --- | --- |
| Seeded random generator | P1, P3, P9, P10, P11 | `tests/rng.js` already has one. Move it into `shared/` so pages can reproduce a chart from a seed. |
| SVG helpers | P1, P2, P5, P6, P7 | A small helper to build strokes and shapes in mm. SVG shapes are content, so they print without "background graphics"; confirm with the print check. |
| Screen calibration value | I1, I2, I4, I5 | See U1. |
| Animation loop | I1 to I5 | One helper that runs on the browser's frame timer, starts only on request, stops cleanly, and checks `prefers-reduced-motion`. |
| Audio tick | I2, I3, I6 | The browser's audio API needs no network. |
| Prefill from the URL | P3, P4 | Carry only sizes, never personal details. |

## Needs hardware, so probably out of scope

These depend on physical equipment, so a page could only describe or prepare for them: a physical Brock string, a hanging Marsden ball, accommodative flipper lenses, prism bars, an aperture rule trainer, polarised vectograms, light boards such as a saccadic fixator, and balance boards. Setup or instruction sheets could still be worth adding for some of them.

## Be careful with these

- **Diagnostic or screening tests.** Visual acuity charts, colour-vision plates, Amsler grids, stereoacuity tests and standardised eye-movement tests give results people may act on. A web page cannot control screen size, viewing distance or lighting, so results would mislead. Leave these to professionals.
- **Treatment claims.** Never describe a tool as treating a condition. Say what the exercise is and point people to their therapist.
- **Settings that look like a prescription.** Separations, speeds and durations should be the user's choice with neutral starting values.
- **Children.** Some activities are described for children under supervision. The disclaimer already says to use exercises as directed by a vision therapist; keep it on every page.

## Names, copying and trademarks

- **Named tests.** "Groffman Visual Tracing" and the "Developmental Eye Movement" test are published clinical tests with their own forms and scoring. Tools here would make generic exercise charts. They would not reproduce those forms, claim to be those tests, or score results.
- **Vendor products.** A vendor name (Good-Lite) appears in this document only to cite a source. Do not copy any vendor's card artwork, wording or layout. Original designs only, with plain descriptive names.
- **Generic terms.** Brock string, Schulte table, pencil push-up and similar names are used generically.
- **Code and generated pages** are the repo's own and are MIT licensed.

## A possible order

1. **U1 Screen calibration**, because it makes every on-screen exercise meaningful, after deciding how it is remembered.
2. **P3 Matched Hart pair and P4 Letter-size calculator**, small steps that extend what exists.
3. **P2 Saccade cards and P5 Pursuit pattern sheets**, small printables that need no new maths.
4. **P1 Visual tracing charts**, the first piece with new maths.
5. **I1 Pursuit tracker, I2 Saccade trainer and I6 Rep and rest timer**, the first interactive tools.
6. **P6 Fusion and stereogram cards**, then **P11 Random-dot stereograms**, which need the most care.

## Open questions

- Is the main use printing for home practice, or on-screen practice?
- Who is the audience: a therapist preparing materials, or people practising at home?
- Should the site ever store anything (U1 calibration, U3 practice log), or stay a store-nothing site? Session-only storage would be a middle path, but it is still storage.
- Are red/green glasses and other equipment realistic to assume?
- Should anything be offered to children directly, or only to adults who then guide them?

## Sources

Only sources that were opened and read for this document are linked.

- [Application, limits, scoring and improvements of Groffman Visual Tracing test](https://open.lnu.se/index.php/sjovs/article/view/3426) (Scandinavian Journal of Optometry and Visual Science, 2020): describes the test as a clinical eye-movement evaluation using cards of tangled, crossing lines, and reports that the standard version was too hard for many young children (24% of 1st and 3rd graders followed no line correctly) while a simplified version worked better.
- [Good-Lite Eccentric Circles Vision Therapy Cards](https://store.good-lite.com/products/good-lite-eccentric-circle): paired cards for fusion, convergence and divergence work with central anti-suppression targets, alignment marks and a red/green version, sold for use under a healthcare professional's guidance.
- [Understanding stereograms](https://www.evelinalondon.nhs.uk/resources/patient-information/understanding-stereograms.pdf) (PDF patient leaflet, Evelina London, Guy's and St Thomas' NHS Foundation Trust, published March 2023 with a review date of March 2026, so it may since have been revised): describes stereogram cards and the pen exercise, and says an orthoptist explains and demonstrates it.
- [Stereoacuity Improvement using Random-Dot Video Games](https://www.jove.com/t/60236/stereoacuity-improvement-using-random-dot-video-games) (JoVE method article, 2020): a protocol combining optometry-centre visits with home exercises using random-dot software, for stereo-deficient people without strabismus.
- Brock string, pencil push-up, saccade drill and dot card descriptions come from clinic home-program handouts and vendor lists found in searches, none authoritative enough to link.
