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
| P4 | Letter-size calculator | Printable | S | Viewing distance and visual angle to letter height in inches |
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
| U1 | Screen calibration | Utility | S | Matches an on-screen box to a credit card to get pixels per mm (built) |
| U2 | Home program sheet | Utility | S | A printable one-page schedule typed by the therapist or parent |
| U3 | Practice log | Utility | M | Records what was done and when (a policy decision) |
| U4 | Remembered settings | Utility | S | Each tool reopens with the settings the user last chose (built) |
| U5 | Global settings | Utility | M | Settings for every tool at once, starting with inches or metric units |

## What every new tool must meet

From `CLAUDE.md`, so an idea is costed with these in mind:

- Copy `_template/`. Keep the maths in its own file with tests, and let the page code only read controls and draw.
- Lay out in millimetres, and show inches to the user (controls, readouts and notes; see the units note in `CLAUDE.md`). Printable tools must pass the real print check (page count, true size, nothing cut off) on Letter and A4, with default print settings, so no shape may rely on a background colour.
- Use `shared/paper.js` to tell the user when something will not fit a page.
- Moving content needs a clear start and stop, must respect `prefers-reduced-motion`, and must not flash faster than 3 Hz.
- No network requests, no new runtime dependencies, strict CSP. The site stores only each tool's control settings, on the device (see U4). Anything more, such as a practice log, needs a deliberate decision and an update to the README and `SECURITY.md`.
- The footer disclaimer stays on every page, and the notes file for the tool states where its description comes from.

## Printable generators

These fit the repo best: they are about exact sizes in millimetres, which the layout and print checks already cover.

### P1. Visual tracing charts

- **What:** a column of letters and a column of numbers, each letter joined to a number by a curved line, with the lines crossing. The person follows each line with their eyes and names the number it ends at. Charts like this are described as activities in practitioner material found in searches, and the Groffman version is a clinical test.
- **Controls:** number of pairs, how winding the lines are, chart size in inches, line thickness and label size, a seed so a chart can be reproduced, and an answer key.
- **Design note:** the Groffman Visual Tracing test (see [names](#names-copying-and-trademarks)) is a published clinical test. A study of it found the standard version too hard for young children: 24% of 1st and 3rd graders followed no line correctly, and a simplified version worked better. So offer few pairs and gentle curves by default. A practitioner write-up found in a search (not reachable when checked, so not linked) suggested more pairs to make it harder and tracing with a finger to make it easier.
- **Maths:** generate smooth paths between fixed endpoints so that crossings are clear and no two lines run close together or on top of each other except where they cross. The unambiguous-line generator is the real work.
- **Print notes:** draw with SVG strokes, which print without "background graphics". Confirm with the print check.
- **Tests:** every letter maps to exactly one number, no two paths come closer than a minimum gap except at crossings, the crossing count stays in range, and the same seed gives the same chart.
- **Risk:** not a test. The page must not score, time against norms, or present itself as an evaluation.

### P2. Saccade cards

- **What:** target cards (letters, numbers or shapes) to place a set distance apart, for looking back and forth. Clinic home programs describe two notes on a wall about shoulder-width apart, and drills that alternate horizontally or vertically for a set time.
- **Controls:** number of targets (2 or 4), target type and size in inches, orientation, and a printed instruction giving the centre-to-centre spacing to use.
- **Print notes:** a shoulder-width spacing is wider than a page, so print each target on its own sheet and print the spacing as an instruction. Page-fit checking comes from `shared/paper.js`.
- **Tests:** target sizes (checked in mm, shown in inches) and the page-fit result.

### P3. Matched Hart pair

- **What:** one click produces a large chart for the wall and a small chart for the hand with the same letters and the same rows and columns, as the Hart chart notes describe. Already on the Hart chart's own ideas list.
- **Controls:** the existing Hart settings plus the small chart's letter height.
- **Maths:** build the letter grid once (`buildGrid` already takes a random function) and lay it out twice.
- **Notes:** a wall chart with big letters will not fit a page. Either cap the size to one page, or add tiling across several pages, which is also on the ideas list.
- **Tests:** both charts hold identical letters.

### P4. Letter-size calculator

- **What:** enter a viewing distance and the visual angle the letters should span, and get the letter height in inches. Also the reverse.
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
- **Controls:** the separation in inches, parallel or crossed viewing for the fusion cards, line thickness, the colour pair for the red/green version, and for the stereogram cards a choice of picture (letters, simple shapes) with the split between the two incomplete images.
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
- **Controls:** grid size, target letters, text size in inches. Offer a printable sheet and a clickable version with a timer.
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

- **Status:** built as `screen-calibration/` (see [screen-calibration.md](screen-calibration.md)). The calibration is remembered on the device (see U4).
- **What:** the user slides a box until it matches the width of a credit card, which is 85.60 mm wide under the ID-1 card standard, and the page works out pixels per millimetre for that screen.
- **Why:** without it, anything shown at "true size" on screen is only approximate. It is the foundation for the interactive tools.
- **Remembering it:** settled by U4. The calibration is kept on the device with the zoom it was made at, so an on-screen tool can read it back and show the stale warning when the zoom or display has changed.
- **Tests:** the conversion functions.

### U2. Home program sheet

- **What:** the therapist or parent types activities, repetitions and notes, and prints a one-page schedule. Text only.
- **Notes:** no storage and no accounts.

### U3. Practice log

- **What:** a record of what was done and when.
- **Policy decision:** the site stores only each tool's control settings (U4). A practice log is more personal data: it needs local storage, a clear statement that it never leaves the device, a way to see and delete it, and updates to the README and `SECURITY.md`. Decide it on purpose.

### U4. Remembered settings

**Status: built.** `shared/settings.js` (tested logic and the storage wrapper), `shared/remember.js` (the controls), a `remembered.js` list and a Reset settings button in every exercise, and a test that fails an exercise without them. It was built **on by default**, not opt-in, because the point is that a refresh or a later visit shows the previous settings; the README, `SECURITY.md`, the landing page and each tool now say plainly what is kept and where. The screen calibration is kept too, with its device pixel ratio so a different zoom or display shows the stale warning. The text below is the original plan; the "choices to make" were settled as: on by default, one shared module, version number 1, keys named `vision-therapy-tools:<tool>`, and the notes redrawn from the restored values because the page draws after restoring.

- **What:** each tool remembers what the user last set its controls to, so a refresh or a later visit shows the same settings instead of the defaults. It would cover the sliders, selects and checkboxes of the Hart chart, the Macdonald cards and the screen calibration (once the calibration is something to keep), and the moving-ring and letter options planned in [macdonald-cards-feedback-plan.md](macdonald-cards-feedback-plan.md).
- **How it could work:**
  - One small shared module (for example `shared/settings.js`) that saves a tool's control values in the browser's own storage (`localStorage`) under a key per tool, and puts them back on load.
  - Keep the reading and writing in small pure functions (pick the controls to remember, check each saved value against the control's `min`, `max` and options, fall back to the default when it is missing or wrong) so they can be tested without a browser.
  - Save when a control changes. A "Reset to defaults" button per tool clears it.
  - Not remembered: the random letters themselves (a regenerated chart or card is new each time), and anything personal.
  - Storage can be blocked or full (private windows, site data turned off), so every read and write sits in a try/catch and the page works with defaults when it fails.
  - Saved values are untrusted input: a stale or edited value (an old slider range, a removed option) must be ignored, never trusted.
- **Policy decision:** the README and `SECURITY.md` say the site stores nothing. This would store a few control values on the user's own device, never sent anywhere (the CSP already blocks all network access). It needs a plain statement in the README, `SECURITY.md`, `CLAUDE.md` and each tool's notes that settings are kept only in this browser and can be reset, and a decision on whether remembering is on by default or opt-in with a checkbox.
- **Choices to make:**
  - On by default or opt-in? Opt-in is the cautious reading of the current promise; on by default is the friendlier behaviour.
  - Shared devices: one browser profile shared by several people sees the last person's settings.
  - What the keys are called and a version number in them, so a later change to a control's range can discard old values cleanly.
  - The settings of the cards and chart can change what a page-fit note says on load; the note must be redrawn from the restored values.
- **Tests:** saving and restoring round-trips; a value outside the control's range or not in its list falls back to the default; corrupt or missing storage gives defaults; a blocked storage object does not throw; a version change discards old values; reset clears the saved values. A real-browser check: change settings, reload, and confirm they come back; then block storage and confirm the page still works.
- **Effort:** S for one tool, then small for each other because the module is shared.
- **Related:** U1 (the calibration needs remembering most), U3 (a practice log needs the same policy decision), U5 (settings that apply to every tool).

### U5. Global settings

- **What:** a few settings that belong to the user rather than to one chart, set once and applied by every tool. The first and clearest is **units: imperial (inches) or metric (millimetres and centimetres)**. Today every page shows inches and there is no way to change that.
- **Candidates, roughly in order of value:**
  - **Units.** Controls, readouts, notes and the calibration ruler follow the choice. The layout maths and CSS stay in millimetres either way, so printing is unaffected.
  - **Paper size.** Letter or A4. The page-fit limits in `shared/paper.js` use the smaller of the two so one note fits both; knowing the real paper would let the note be exact and allow larger charts on the larger paper.
  - **Reduced motion.** Follow the system setting by default, with an override for the tools that move (planned in [macdonald-cards-feedback-plan.md](macdonald-cards-feedback-plan.md)).
  - **Default viewing distance**, once a tool shows sizes as a visual angle (P4).
  - **Interface size or contrast**, for the controls only. Exercise content keeps its own sizes, and printed output is never changed by it.
- **Where it lives:** a small control in the shared header bar (`shared/header.html`), so it is on every page and not copied into each tool. This puts the first script on the landing page, which today has none and a CSP without `script-src`; that is a deliberate widening to settle.
- **How the units part would work:**
  - Each length control declares its range for both systems, for example the Hart chart letter height as 0.08 to 1.2 in in 0.02 steps and as 2 to 30 mm in 0.5 steps, so that every step is a tidy number in either system. Converting the current value when the user switches means snapping it to the nearest step of the other system.
  - One shared module (extending `shared/units.js` and `shared/format.js`) holds the unit definitions and the text helpers, which take the chosen unit. Tools stop calling inch-only helpers directly.
  - Facts that the HTML repeats (the reference options on the calibration page, the custom length limits, slider attributes) must be written for both units, and the existing HTML-versus-constants tests extended to check both. This is the main cost: it roughly doubles the places a number can drift.
  - The calibration ruler needs a metric version again (centimetre, half-centimetre and millimetre ticks, and a 50 mm square) beside the inch one.
- **Starting value:** the current behaviour (inches) is the default. Guessing from the browser's language is possible but unreliable; decide whether to guess at all.
- **Where the choice is kept:** this is the same problem as U4 and should use the same mechanism, so a user who picks metric does not have to pick it again on every page and visit. Without U4 the choice would reset on each page load, which is not usable. A no-storage alternative is a URL parameter (for example `?units=mm`) that the header links carry from page to page, which is shareable but lost when someone types a page address. Decide U4 first.
- **Choices to make:**
  - Which settings are really global and which belong to one tool. Keep the list short; a setting only a single tool uses stays on that tool.
  - Whether to add a settings panel or only the units control for now.
  - Wording: "Imperial / Metric" or "Inches / Millimetres". The second says what the user will see.
- **Tests:** the conversion round trip and snap-to-step for every length control; each length control has a definition for both units and its HTML attributes agree with them; the text helpers give the right unit label and decimals in each; the header control is on every page and the pages test still passes with the extra script allowed by the CSP; a real-browser check that switching units changes every readout, note and the ruler, and that a printed chart is the same size either way.
- **Effort:** M for units across the three existing tools. Later settings are small.
- **Related:** U4 (storage and the policy decision), P4 (viewing distance).

## Shared building blocks

Several ideas would need the same pieces. Building them once, in `shared/` with tests, keeps the tools consistent.

| Piece | Used by | Notes |
| --- | --- | --- |
| Seeded random generator | P1, P3, P9, P10, P11 | `tests/rng.js` already has one. Move it into `shared/` so pages can reproduce a chart from a seed. |
| SVG helpers | P1, P2, P5, P6, P7 | A small helper to build strokes and shapes in mm. SVG shapes are content, so they print without "background graphics"; confirm with the print check. |
| Screen calibration value | I1, I2, I4, I5 | See U1. |
| Remembered settings | Hart chart, cards, calibration, any new tool | See U4. One shared module, one policy decision. |
| Global settings (units and others) | Every tool | See U5. Shares the storage of U4. Unit definitions go in `shared/units.js`. |
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

1. **U1 Screen calibration** (built), because it makes every on-screen exercise meaningful. Deciding how it is remembered comes next (see U4).
2. **P3 Matched Hart pair and P4 Letter-size calculator**, small steps that extend what exists.
3. **P2 Saccade cards and P5 Pursuit pattern sheets**, small printables that need no new maths.
4. **P1 Visual tracing charts**, the first piece with new maths.
5. **I1 Pursuit tracker, I2 Saccade trainer and I6 Rep and rest timer**, the first interactive tools.
6. **P6 Fusion and stereogram cards**, then **P11 Random-dot stereograms**, which need the most care.

## Open questions

- Is the main use printing for home practice, or on-screen practice?
- Who is the audience: a therapist preparing materials, or people practising at home?
- U4 settled that the site may keep a tool's control settings on the device. Is a practice log (U3), which is more personal, acceptable too, or does the site stop at settings?
- Should there be a global units setting (inches or metric), and should it be remembered (U5, which depends on U4)?
- Are red/green glasses and other equipment realistic to assume?
- Should anything be offered to children directly, or only to adults who then guide them?

## Sources

Only sources that were opened and read for this document are linked.

- [Application, limits, scoring and improvements of Groffman Visual Tracing test](https://open.lnu.se/index.php/sjovs/article/view/3426) (Scandinavian Journal of Optometry and Visual Science, 2020): describes the test as a clinical eye-movement evaluation using cards of tangled, crossing lines, and reports that the standard version was too hard for many young children (24% of 1st and 3rd graders followed no line correctly) while a simplified version worked better.
- [Good-Lite Eccentric Circles Vision Therapy Cards](https://store.good-lite.com/products/good-lite-eccentric-circle): paired cards for fusion, convergence and divergence work with central anti-suppression targets, alignment marks and a red/green version, sold for use under a healthcare professional's guidance.
- [Understanding stereograms](https://www.evelinalondon.nhs.uk/resources/patient-information/understanding-stereograms.pdf) (PDF patient leaflet, Evelina London, Guy's and St Thomas' NHS Foundation Trust, published March 2023 with a review date of March 2026, so it may since have been revised): describes stereogram cards and the pen exercise, and says an orthoptist explains and demonstrates it.
- [Stereoacuity Improvement using Random-Dot Video Games](https://www.jove.com/t/60236/stereoacuity-improvement-using-random-dot-video-games) (JoVE method article, 2020): a protocol combining optometry-centre visits with home exercises using random-dot software, for stereo-deficient people without strabismus.
- Brock string, pencil push-up, saccade drill and dot card descriptions come from clinic home-program handouts and vendor lists found in searches, none authoritative enough to link.
