# Macdonald Form Field Cards

Notes, history and documentation for the first tool in this repo (`macdonald-form-field-cards/`).

> Not medical advice. This page describes a vision therapy exercise for background only. Use it as directed by a vision therapist.

## What the exercise is

A Macdonald Form Field Recognition Card is a printed card with a small fixation target at the center (a fine circle and dot) surrounded by rings of letters. Letters get larger the farther they are from the center. The person holds fixation on the center and tries to name or recognize the surrounding letters using peripheral vision, without moving their eyes to them.

Vendors describe commercial cards as printed on grey cardstock, with a fine circle and dot at the center that they say is more sensitive to blur.

Uses described by vendors and practitioner write-ups (this is not clinical evidence, and this repo makes no claims about effectiveness):

- Building peripheral awareness and widening the field of attention
- Form recognition and blur detection
- Contrast sensitivity
- Modified plus acceptance routines (as a target while working with lenses)
- Practice in distinguishing central from peripheral vision (one practitioner write-up describes it as especially useful for people with esophoria or esotropia)

The exact routines (distance, lens use, timing, whether to fixate and then saccade to check) are set by the supervising therapist and vary. This repo does not prescribe any.

## History

- The card is based on procedures developed by **Lawrence W. Macdonald, O.D.**, and **J. Baxter Swartwout, O.D.**, optometrists (O.D.).
- The cards are still sold today as printed cards by suppliers such as the Optometric Extension Program Foundation (OEPF), Bernell and Jutron Vision.
- TODO: confirm original publication dates and sources. The research behind this file did not turn up primary sources for when the cards were first published.

## How the tool here relates

The generator creates **new, original** cards in the same style: concentric rings of letters with size scaling outward from a central fixation point. It does not copy any vendor's artwork or layout. It is a neutral implementation of the exercise concept, and is not affiliated with or endorsed by Macdonald, Swartwout or any vendor.

### Where the code lives

| File | What it does |
| --- | --- |
| `index.html` | Markup only: controls, buttons, the card container |
| `main.js` | Reads the controls, draws the card, writes the note under the buttons |
| `layout.js` | The maths: card size, ring placement, auto-fit, letter placement. No DOM access, so it is tested |
| `style.css` | Card, dot, circle and letter styles, plus print overrides |
| `../shared/` | Styles and helpers shared with other exercises, including `paper.js` (will it fit a Letter/A4 page, and what to tell the user) |
| `../tests/cards-layout.test.js` | Sweeps every combination of settings for clipping and overlap, using each letter's ink area plus a small margin |
| `../tests/paper.test.js` | The page-fit logic behind the note about printing |
| `../tests/pages.test.js` | Checks the page against the project conventions, including that its CSS does not depend on background colours |

### Settings in the page

| Control | Meaning |
| --- | --- |
| Number of Rings | How many concentric rings of letters (3 to 7, default 5) |
| Letters per Ring | Letters spaced around each ring (3 to 10, default 6) |
| Card Size (long side) | Length of the card's longer side in inches (4 to 10 in 0.1 steps). Default 8.5 in |
| Aspect Ratio | Card proportions; the shorter side follows from this. Five choices from 5.5 : 8.5 (portrait, the default) to 8.5 : 5.5 (landscape) |
| Base Letter Height | Capital-letter height in inches for the innermost ring (0.04 to 0.24 in 0.01 steps, default 0.08) |
| Scale Factor | How much larger each successive ring's letters are (1.3 to 2.5, default 1.6) |
| Letter Set | Pool of letters drawn from: A to Z, consonants only, or vowels only |
| Use every letter once | Off by default. Puts the whole chosen set on the card exactly once (26 letters, 21 consonants or 5 vowels) and spreads it over the rings, as evenly as possible with the extra letters on the outer rings (26 over 5 rings is 5, 5, 5, 5, 6). The letters-per-ring control is then not used and reads "varies", and so is the no-repeats option. A ring needs at least 3 letters, so a small set uses fewer rings than asked for (the 5 vowels fill one ring), and the note says so |
| No repeated letters on the card | On by default. Letters are dealt from the chosen set across the whole card, so no letter appears twice until every letter in the set has been used. Off: each ring is picked on its own and the same letter can appear in several rings |
| Moving Ring | None by default. After a card is generated, the choices are its rings (Ring 1 is the innermost). The chosen ring can turn round the fixation point while the others stay still |
| Direction | Clockwise (default) or counterclockwise, as seen on the screen. Applies at once, even while the ring is turning |
| Speed | 1 to 30 turns a minute (default 6, one turn in 10 seconds). Applies at once |
| Start moving ring | Starts and stops the turning. It is off until pressed, and it is not available until a ring is chosen. Escape also stops it |
| Center dot | Checkbox to show or hide the fixation circle and dot (on by default) |

Letters are picked at random when a card is generated. With "No repeated letters on the card" on (the default), none appears twice: a card of up to 26 places (rings times letters per ring) shows different letters, and the note under the buttons says how many of the alphabet are used. A card with more places than the set has letters (the default 5 x 6 is 30 places against 26 letters) uses every letter before repeating any, and the note says how many repeat. Consonants (21) and vowels (5) repeat sooner for the same reason. Inside one ring a letter never repeats unless the set is smaller than the ring. "Print Card" prints just the card. The default card is 5.5 x 8.5 in and fits one page. A note under the buttons shows the card's size in inches, how it will print, and any warning (letters shrunk to fit, letters too small to read, will not fit a page).

### How layout works

- All geometry is in millimetres (CSS `mm`), so printing at 100% scale gives true physical size. Check with a ruler, because browsers and printers can rescale.
- Letter size in ring *n* is `base * scale^n`.
- Rings are placed outward so that neighbouring rings, and neighbouring letters within a ring, cannot touch even with the random wobble.
- If the requested sizes do not fit on the card, **every letter is shrunk by the same factor** (keeping the size progression) until the outer ring fits. A note under the buttons says how much. So Base Letter Height is the size you ask for, not a guarantee. Raise the card size or lower rings, letters per ring or scale factor to keep the full size.
- Rings can hold different numbers of letters: `layoutRings`, `fitRings` and `placeLetters` take either one number or an array with a count per ring, and `ringCounts` works out the array for "Use every letter once". The tests sweep sizes, shapes, ring counts and all three letter sets for clipping and overlap.
- Letters are positioned relative to the inside of the card border, so measure from the padding box (`BORDER_MM` in `layout.js`) or letters drift off-center from the fixation dot. `main.js` passes `BORDER_MM` to the CSS as `--border-mm`, so the border width is defined once.

### The moving ring

- Each letter keeps the distance from the center it was drawn at and is moved round it, not rotated, so letters stay upright. The maths (`advanceAngle`, `turnedPosition`) is in `motion.js`, and `placeLetters` returns each letter's `ring`, `angle` and `r` for it.
- It turns smoothly, one frame at a time (`requestAnimationFrame`). Each frame adds the time since the last, but never more than 100 ms, so a tab that was in the background does not make the ring jump. Browsers pause frames in a hidden tab.
- Only the chosen ring's letters are moved, and only their `left` and `top`. Stopping leaves the ring where it is, and Start continues from there. Choosing another ring (or None) puts the old one back where it was drawn. Generating a new card stops it, and keeps the choice if that ring still exists.
- There is no flashing: the letters move continuously and nothing changes visibility. Nothing starts by itself, which is also what `prefers-reduced-motion` asks for; a device set to reduce motion gets an extra line in the note.
- **Clearance while turning.** The card is laid out so still letters keep 0.1 em apart. A turning ring passes its neighbours at angles that layout did not plan for. Measured over a sweep of sizes, shapes, ring counts and speeds, the ink of two letters never overlaps and the closest approach is about 0.065 em (a little over a twentieth of the larger letter's height). Keeping 0.1 em throughout would have meant spacing the rings further apart on every card, which makes every letter smaller, so it was not done. `tests/motion.test.js` checks the clearance at 24 angles per ring.
- **Printing** prints the card as it is on the screen, so a ring that is mid-turn prints where it has got to. The note says so.

### Gotchas

- **Sliders do not redraw the card.** Only the value readouts update live. Click "Generate Card" to apply settings, because each generation is random.
- **Small cards with many rings get tiny letters.** Fitting shrinks letters instead of refusing, so 7 rings of 10 letters on a 4 in card can be unreadable. When the innermost letters end up under about 0.06 in (1.5 mm) tall (`MIN_LETTER_MM`), the note under the buttons turns amber with a warning. It is a warning only; the card is still drawn.
- **Screen size is approximate.** CSS `mm` is exact in print but screens vary, so a card on screen is not true size. On a screen narrower than the card (the default is about 528 px wide) the card scrolls sideways inside its own box; the page itself does not.
- **Letter height is cap height** (about 0.716 of the font size for Arial), not font size.
- **Page fit is reported under the buttons.** A card that only fits a sideways page shows "Print in landscape." (choose landscape in the print dialog). A card too big for either orientation, such as a 10 in square, shows an amber warning, because it would be cut off or split across pages. The limit is about 7.2 x 10 in upright (Letter or A4 with 0.5 in margins; larger print margins will clip), from `shared/paper.js`.
- **The fixation dot is drawn with a border, not a background.** Browsers do not print backgrounds by default, so a background-filled dot disappeared from printouts. Keep it a border (a test guards this).

### Ideas for later

- Grey card background option, matching the traditional cards. Browsers do not print backgrounds by default, so this needs a print-safe approach (or an instruction to turn on background graphics) and would have to be an exception to the no-backgrounds rule in `CLAUDE.md`
- Choose letter size by visual angle at a given viewing distance
- Seeded randomness so a given card can be regenerated or shared
- Remember the last settings on the device (idea U4 in `tool-ideas.md`; needs a decision on the "stores nothing" promise)
- Reverse the direction each lap, or turn more than one ring at once (not asked for yet)

## Legal notes

- The exercise is a method, which copyright does not protect. Specific printed card artwork is copyright of its publisher, so do not copy it.
- A search found no trademark for "MacDonald Letters". That was not a formal trademark search. "Macdonald" here refers to the clinician who developed the procedure; the tool name is descriptive.
- Code in this repo is MIT licensed (see `LICENSE`).
- This is not legal advice. Check the USPTO database or ask a lawyer before any commercial use.

## Sources

- [OEPF: MacDonald Form Recognition Field Cards](https://www.oepf.org/product/macdonald-form-recognition-field-cards-100-pack/)
- [Bernell: Macdonald Form Field Recognition Cards](https://www.bernell.com/product/MCDC5/Index_M)
- [Jutron Vision: Macdonald Form Field Recognition Cards](https://www.jutronvision.com/product/macdonald-form-field-recognition-cards-5-pack/)
- [Peripheral Awareness: Old Macdonald Had A Form](https://visionhelp.wordpress.com/2016/07/12/peripheral-awareness-old-macdonald-had-a-form/)
