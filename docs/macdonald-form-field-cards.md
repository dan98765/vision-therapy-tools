# Macdonald Form Field Cards

Notes, history and documentation for the first tool in this repo (`index.html`).

> Not medical advice. This page describes a vision therapy exercise for background only. Use it as directed by a vision therapist.

## What the exercise is

A Macdonald Form Field Recognition Card is a printed card with a small fixation target at the center (a fine circle and dot) surrounded by rings of letters. Letters get larger the farther they are from the center. The person holds fixation on the center and tries to name or recognize the surrounding letters using peripheral vision, without moving their eyes to them.

Commercial cards are typically printed on grey cardstock to give a lower-contrast background. The fine central figure is useful because it is more sensitive to blur: if the person's focus shifts, the center target becomes noticeably blurry.

Reported uses in vision therapy:

- Building peripheral awareness and widening the field of attention
- Form recognition and blur detection
- Contrast sensitivity
- Modified plus acceptance routines (as a target while working with lenses)
- Practice in distinguishing central from peripheral vision, sometimes cited for people with esophoria or esotropia

The exact routines (distance, lens use, timing, whether to fixate and then saccade to check) are set by the supervising therapist and vary. This repo does not prescribe any.

## History

- The card is based on procedures developed by **Lawrence W. Macdonald, O.D.**, and **J. Baxter Swartwout, O.D.**, optometrists in the behavioral/developmental optometry tradition.
- It is a long-standing piece of optometric vision therapy equipment, still sold today as printed cards by suppliers such as the Optometric Extension Program Foundation (OEPF), Bernell and Jutron Vision.
- TODO: confirm original publication dates and sources. The research behind this file did not turn up primary sources for when the cards were first published.

## How the tool here relates

The generator creates **new, original** cards in the same style: concentric rings of letters with size scaling outward from a central fixation point. It does not copy any vendor's artwork or layout. It is a neutral implementation of the exercise concept, and is not affiliated with or endorsed by Macdonald, Swartwout or any vendor.

### Settings in `index.html`

| Control | Meaning |
| --- | --- |
| Number of Rings | How many concentric rings of letters |
| Letters per Ring | Letters spaced around each ring |
| Card Width | Printed width of the card |
| Aspect Ratio | Card proportions |
| Base Font Size | Letter size in the innermost ring |
| Scale Factor | How much larger each successive ring's letters are |
| Letter Set | Pool of letters drawn from (e.g. A to Z) |

Letters are picked at random for each ring when a card is generated. "Print Card" prints just the card.

### Ideas for later

- Grey card background option and a fine circle-and-dot center target, matching the traditional cards
- Calibrated physical sizing (mm/in) so letter size corresponds to a chosen viewing distance
- Seeded randomness so a given card can be regenerated or shared
- Letter-size units in terms of visual angle at a given distance

## Legal notes

- The exercise is a method, which copyright does not protect. Specific printed card artwork is copyright of its publisher, so do not copy it.
- A search found no trademark for "MacDonald Letters". That was not a formal trademark search. "Macdonald" here refers to the clinician who developed the procedure; the tool name is descriptive.
- Code in this repo is MIT licensed (see `LICENSE`).
- Not a lawyer; check the USPTO database or ask one before commercial use.

## Sources

- [OEPF: MacDonald Form Recognition Field Cards](https://www.oepf.org/product/macdonald-form-recognition-field-cards-100-pack/)
- [Bernell: Macdonald Form Field Recognition Cards](https://www.bernell.com/product/MCDC5/Index_M)
- [Jutron Vision: Macdonald Form Field Recognition Cards](https://www.jutronvision.com/product/macdonald-form-field-recognition-cards-5-pack/)
- [Peripheral Awareness: Old Macdonald Had A Form](https://visionhelp.wordpress.com/2016/07/12/peripheral-awareness-old-macdonald-had-a-form/)
