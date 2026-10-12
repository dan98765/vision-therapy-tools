# Macdonald Form Field Cards: plan for user feedback

> Not medical advice. This is a plan for changing a practice-card generator, not a clinical protocol.

Feedback received from a user of [Macdonald Form Field Cards](macdonald-form-field-cards.md):

1. An option to have **one ring moving in a circle**, and to **choose which ring**.
2. **All letters of the alphabet should be present, with no repeated letters.**

**Status:** the no-repeat letters option (request 2, option A) is built; see "Request 2" below. The "use every letter once" mode (option B) is built too ("Use every letter once" below). The moving ring (request 1) is built too (see "Request 1" below). Remembered settings are built too (see "Remembering the settings" below). This plan is complete. This file records what each request means, how it fits the current code, the decisions still open, and the order to do the work in.

## Answers from the user

- **Repeats apply to the whole card**, not each ring (option A below, no letter repeated anywhere on the card).
- **The ring turns smoothly**, not letter by letter.
- **Direction and speed are both options** the user can set.
- **Letters stay upright** as they travel round the ring.

The questions below that these answer are kept for the reasoning; still open are what to do when the card has more positions than the letter set has letters, and whether "use every letter once" (option B) is wanted.

## Where things stand

- `placeLetters` in `macdonald-form-field-cards/layout.js` picks letters **per ring** with `pickLetters(pool, perRing)`. Each ring has no repeats inside it, but the same letter can appear in several rings.
- Rings are 3 to 7 and letters per ring 3 to 10, so a card holds 9 to 70 letters. The default (5 x 6) is 30.
- The card is drawn once per "Generate Card" click (`main.js`). Nothing moves, and each ring gets a random start rotation.
- The page is static markup plus printable output. Nothing animates yet, so request 1 is the first moving part in the repo.

## Request 2: every letter once, no repeats

### The conflict to settle first

The alphabet has 26 letters. A card with more than 26 positions cannot show every letter exactly once, and a card with fewer cannot show them all. The current default of 30 already has 4 repeats. So "all letters present, none repeated" only works when rings x letters per ring = 26 (or the pool size). Possible readings:

| Option | What it means | Cost |
| --- | --- | --- |
| A. **No repeats anywhere on the card** (recommended first step) | Draw every letter without replacement across the whole card, from the chosen set. When the card has more positions than letters, say so and either repeat only after the pool is used up or cap the controls. | Small: change how the pool is dealt out |
| B. **Whole alphabet exactly once** | Add a mode that uses all 26 letters, spread over the rings, and sets rings x letters per ring to fit 26 (for example 2 x 13 or 26 split unevenly). | Medium: uneven rings change the layout maths, and 3 to 7 rings does not divide 26 |
| C. **Whole alphabet present, repeats only when forced** | Every letter appears at least once, extra positions are filled with repeats. | Contradicts "no repeats" when there are more than 26 positions |

Recommendation: do **A** for every letter set, and offer **B** as a "Use every letter once" checkbox that adjusts the other sliders. Ask the user which they meant before building B.

### Decisions needed

- Is the rule for the **whole card** (every letter once in total) or **each ring** (what it does now)? The wording suggests the whole card.
- For the consonants-only (21) and vowels-only (5) sets, "all letters present" means all of that set. With 5 vowels, no repeats caps the card at 5 positions, which is below the current 9 minimum. Likely answer: allow repeats for the small sets and say so in the note.
- Which letters go in which ring? Random is the current behaviour. If a therapist wants each letter at a known size, a fixed (or seeded) order would help; see "Seeded randomness" in the card notes.

### What was built

Option A, as a checkbox "No repeated letters on the card", **on by default**. `dealLetters` in `shared/letters.js` deals letters from the pool across all rings, so a letter is used a second time only after every letter has been used once, and a ring never repeats a letter inside itself unless the set is smaller than the ring. `placeLetters` takes `{ noRepeats }`, and `letterUseNote` in `shared/format.js` gives the note under the buttons (all used once, how many are missing, or how many repeat). Sizes and positions are unchanged, so the clipping and overlap tests still cover it. Tests: `tests/letters.test.js`, `tests/cards-layout.test.js`, `tests/format.test.js`.

The default card (5 rings of 6) has 30 places against 26 letters, so on first load the note says four letters appear twice. Equal rings cannot make exactly 26 (26 is 2 x 13, and rings hold 3 to 10), so option B would need uneven rings or a different slider range.

### Option B, built

A second checkbox, "Use every letter once (rings hold different numbers)", off by default. It puts the whole chosen set on the card once and spreads it over the rings with `ringCounts` (`layout.js`): counts differ by at most one, with the extra letters on the outer rings, and no ring has fewer than 3 letters, so a small set uses fewer rings (the 5 vowels use one). The layout functions accept a per-ring count array, and a guard stops a ring of fewer than 2 letters dividing by zero. The letters-per-ring and no-repeats controls are disabled while it is on. The note under the buttons lists the counts, innermost first. Equal rings were not used because 26 does not divide into 3 to 7 rings; uneven rings avoid changing the sliders' ranges.

### How it was planned to work

1. Add a `dealLetters(pool, counts, random)` helper to `shared/letters.js` that shuffles the pool once and hands out `counts[i]` letters to ring *i*. Repeats happen only when the total exceeds the pool, and only after every letter has been used, so the pool is always fully used first.
2. `placeLetters` calls it once per card instead of `pickLetters` once per ring.
3. A note under the buttons says when repeats are unavoidable ("30 positions but 26 letters: 4 letters appear twice") and when a card uses the whole set.
4. Optional checkbox "Use every letter once": sets the sliders so rings x letters = pool size, or disables the sliders that cannot help.

### Tests

- Every letter appears exactly once when positions equal the pool size.
- With fewer positions than letters, no letter repeats.
- With more positions than letters, every letter appears before any repeats, and no letter appears more than ceil(positions / pool size) times.
- Same result for a fixed seed (`tests/rng.js`).
- A card with all 26 letters still passes the existing clipping and overlap checks in `tests/cards-layout.test.js`.

## Request 1: one ring moving in a circle

**Built.** The user's answers (smooth, both directions and speed as options, letters upright) are in "Answers from the user" above. What was built: a "Moving Ring" choice (None by default, then one entry per ring), a Direction choice (clockwise, counterclockwise), a Speed slider (1 to 30 turns a minute, default 6) and a Start/Stop button, with Escape also stopping. The maths is `macdonald-form-field-cards/motion.js`, tested in `tests/motion.test.js`, and the behaviour was checked in headless Chrome (only the chosen ring moves, the radius is kept, direction, stop, Escape, switching rings, Generate and reduced motion). One measured finding changed the notes: a turning ring can pass its neighbours closer than the 0.1 em the still layout keeps, down to about 0.065 em, with the ink never touching; see "The moving ring" in [macdonald-form-field-cards.md](macdonald-form-field-cards.md). The design notes below are the plan it followed.

### What it probably means

One chosen ring rotates around the fixation point while the other rings stay still. The number of the ring is chosen by the user. This is a moving target, so the guidance in `CLAUDE.md` for interactive exercises applies.

Questions to put back to the user (they change the design):

- Does the ring **turn smoothly** (like a wheel), or **step** from letter to letter?
- Which direction, and should the direction be selectable (clockwise, anticlockwise, reverse each lap)?
- What speed, and should the user set it?
- Do the **letters keep upright** as they move (they travel round the circle but stay readable), or turn with the ring? Staying upright seems intended for letter recognition.
- Is this for **screen use only**? A printout cannot move, so print output would show the ring at wherever it was.

### Design

- **Controls:** a "Moving ring" select (None, Ring 1 to Ring N, updated when the ring count changes), a speed slider (turns per minute), a direction select, and a Start/Stop button. Default: None, so the page works as it does today.
- **Maths (testable, no DOM):** add `ringAngleAt(baseAngle, elapsedMs, turnsPerMinute, direction)` to `layout.js` or a new `motion.js`, and a function that returns the x, y of each letter in that ring for a given angle. Share the geometry with `placeLetters` so a stopped ring lands exactly on its printed positions.
- **Drawing:** keep the DOM letters, and for the moving ring update only their positions each frame with `requestAnimationFrame`. The still rings are not redrawn. Rotate positions around the card centre (the fixation dot), keeping each letter upright.
- **Wobble:** each letter has a small random offset from its ideal spot. Keep the offset fixed during the animation so letters do not shimmer.
- **Spacing:** rings are spaced so neighbours cannot touch, and a turning ring keeps the same radius, so it cannot touch other rings.
- **Safety and comfort (from `CLAUDE.md`):**
  - Clear Start and Stop, and the ring stays still until Start is pressed.
  - Respect `prefers-reduced-motion`: do not start by itself, and show a note that motion is off until the user starts it deliberately. Decide whether reduced motion should block the feature or only the default.
  - Nothing may flash faster than 3 Hz. Smooth rotation does not flash. Stepping from letter to letter should be capped, and a letter changing visibility must not do so more than 3 times a second.
  - Pause when the tab is hidden (`requestAnimationFrame` does this already) and offer a way to stop with the keyboard (the button is focusable and Space or Enter works).
- **Printing:** "Print Card" prints the ring at its current position. Say so in the note, or stop the ring when printing. Do not print a card with a ring caught mid-step without telling the user.
- **Accessibility:** announce Start and Stop state on the button text ("Start moving ring" / "Stop"). No new network use and nothing stored.
- **Not a clinical claim:** the page offers the option. It does not say what it is for beyond what the exercise notes already say, and says to use it as directed by a vision therapist.

### Tests

- Angle maths: zero elapsed time gives the start angle, a full lap returns to it, direction reverses it, speed scales it.
- Every letter in the moving ring stays at its ring radius (within the float tolerance) at any time.
- Choosing ring N where N is above the current ring count is not possible, and lowering the ring count while a high ring is selected falls back to None.
- Still rings are unchanged when another ring moves.
- `pages.test.js` rules still pass: no inline style or script, no backgrounds needed for what the exercise shows, labels on every new control.
- A real-browser check (puppeteer-core in a scratch folder, as in `CLAUDE.md`): start the ring, sample positions a few frames apart, confirm movement on only the chosen ring, then stop and confirm it stays put. Also check at phone width and with reduced motion emulated.

## Suggested order

1. Ask the user the open questions above (whole card or per ring, and the motion questions).
2. Do request 2, option A first. It is small, self-contained and removes the per-ring repeats now. Tests, update `docs/macdonald-form-field-cards.md` ("Letters are picked at random for each ring" will no longer be true).
3. Add the "use every letter once" mode (option B) if the user wants it.
4. Do request 1 behind a default of "None", with the maths and tests first, then the controls, then the browser checks.
5. Update the card notes, the README row if the description changes, and the "Ideas for later" list. Remembered settings (above) is a separate step after these.

## Remembering the settings

**Built**, as one shared module for every tool (idea U4 in [tool-ideas.md](tool-ideas.md), where the status is). For this page: every control is remembered including the speed and direction of the moving ring, and the two cautions below were followed. The moving-ring choice is not remembered at all (the rings on offer depend on the card that was drawn, so there is nothing safe to restore), and nothing is ever restored as running. The policy decision was made: settings are kept on the device by default, and the README, `SECURITY.md` and the landing page say so. The text below is the original plan.

A related idea, from the same round of feedback: the page should remember what the user last set the controls to, so a refresh or a later visit shows their previous settings. The new controls here (moving ring, speed, direction, no-repeat option) would be remembered too. This is idea U4 in [tool-ideas.md](tool-ideas.md), where the design, the choices and the tests are written down, because it applies to every chart. It is a policy decision first (the site currently says it stores nothing), so settle that before building it, and do it as one shared module rather than card by card. Two cautions for this page:

- Remember the control values, not the random letters, and not whether the ring is running: a page that reloads already moving would break the "starts only when asked" rule.
- Settings that belong to the user and not to this page, such as inches or metric, would live in the global settings idea (U5 in [tool-ideas.md](tool-ideas.md)), not be added to this page alone.
- A saved moving-ring choice must be checked against the current ring count and fall back to None when the ring no longer exists.

## Risks and things to watch

- Request 2 changes the default behaviour of an existing page. Existing users who like independent rings may not want it. Consider making "no repeats across the card" a checkbox, on by default only if the user confirms.
- Request 1 introduces animation, which the rest of the site does not have. It sets the pattern for future interactive tools (a Start/Stop button, reduced motion, no flashing), so do it carefully and write the pattern into `CLAUDE.md` once it exists.
- Moving the ring while the user also holds fixation on the centre is a deliberate part of the exercise. Do not add things that pull the eye to the moving ring (colours, flashes).
