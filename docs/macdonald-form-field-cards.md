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
| `../shared/` | Styles and helpers shared with other exercises |
| `../tests/cards-layout.test.js` | Sweeps every combination of settings for clipping and overlap, using each letter's ink area plus a small margin |

### Settings in the page

| Control | Meaning |
| --- | --- |
| Number of Rings | How many concentric rings of letters |
| Letters per Ring | Letters spaced around each ring |
| Card Size (long side) | Length of the card's longer side in mm (100 to 250). Default 216 mm = 8.5 in |
| Aspect Ratio | Card proportions; the shorter side follows from this |
| Base Letter Height | Capital-letter height in mm for the innermost ring |
| Scale Factor | How much larger each successive ring's letters are |
| Letter Set | Pool of letters drawn from: A to Z, consonants only, or vowels only |
| Center dot | Checkbox to show or hide the fixation circle and dot |

Letters are picked at random for each ring when a card is generated. "Print Card" prints just the card. A note under the buttons shows the card's size in mm and inches.

### How layout works

- All geometry is in millimetres (CSS `mm`), so printing at 100% scale gives true physical size. Check with a ruler, because browsers and printers can rescale.
- Letter size in ring *n* is `base * scale^n`.
- Rings are placed outward so that neighbouring rings, and neighbouring letters within a ring, cannot touch even with the random wobble.
- If the requested sizes do not fit on the card, **every letter is shrunk by the same factor** (keeping the size progression) until the outer ring fits. A note under the buttons says how much. So Base Letter Height is the size you ask for, not a guarantee. Raise the card size or lower rings, letters per ring or scale factor to keep the full size.
- Letters are positioned relative to the inside of the card border, so measure from the padding box (`BORDER_MM` in `layout.js`) or letters drift off-center from the fixation dot. `main.js` passes `BORDER_MM` to the CSS as `--border-mm`, so the border width is defined once.

### Gotchas

- **Sliders do not redraw the card.** Only the value readouts update live. Click "Generate Card" to apply settings, because each generation is random.
- **Small cards with many rings get tiny letters.** Fitting shrinks letters instead of refusing, so 7 rings of 10 letters on a 100 mm card can be unreadable. When the innermost letters end up under 1.5 mm tall (`MIN_LETTER_MM`), the note under the buttons turns amber with a warning. It is a warning only; the card is still drawn.
- **Screen size is approximate.** CSS `mm` is exact in print but screens vary, so a card on screen is not true size.
- **Letter height is cap height** (about 0.716 of the font size for Arial), not font size.
- **Page fit is reported under the buttons.** A card that only fits a sideways page shows "Print in landscape." (choose landscape in the print dialog). A card too big for either orientation, such as a 250 mm square, shows an amber warning, because it would be cut off or split across pages. The limit is about 190 x 250 mm upright (Letter or A4 with 10 mm margins), from `shared/paper.js`.
- **The fixation dot is drawn with a border, not a background.** Browsers do not print backgrounds by default, so a background-filled dot disappeared from printouts. Keep it a border (a test guards this).

### Ideas for later

- Grey card background option, matching the traditional cards
- Choose letter size by visual angle at a given viewing distance
- Seeded randomness so a given card can be regenerated or shared

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
