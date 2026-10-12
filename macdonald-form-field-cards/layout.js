// Layout maths for the Macdonald Form Field Cards. No DOM access, so it can be tested.
// All lengths are in mm; "em" means the font-size of the letter in question.

import { dealLetters, pickLetters } from '../shared/letters.js';

export const BORDER_MM = 0.8;    // card border width (the CSS reads this via --border-mm)
export const GLYPH_REACH = 0.6;  // how far a glyph extends from its center, in em
export const MIN_SPACING = 1.5;  // min distance between neighbours in a ring, in em
export const RING_GAP = 0.15;    // extra gap between rings, in em
export const JITTER = 0.1;       // random wobble of each letter, in em
export const CENTER_CLEAR = 3.5; // clear radius around the fixation circle
export const EDGE_MARGIN = 1;    // keep letters this far inside the border
export const MIN_PER_RING = 3;   // fewest letters on a ring when the rings are filled unevenly

// `perRing` is a number (every ring holds that many letters) or an array with one count per ring.
const countOf = (perRing, i) => (Array.isArray(perRing) ? perRing[i] : perRing);

// How many letters each ring holds when `total` letters are spread over up to `rings` rings, as evenly as
// possible with the extra letters on the outer rings (which have the most room). A ring needs at least
// `minPerRing` letters, so a small set uses fewer rings than asked for. The counts add up to `total`.
export function ringCounts(total, rings, minPerRing = MIN_PER_RING) {
  const used = Math.max(1, Math.min(rings, Math.floor(total / minPerRing)));
  const base = Math.floor(total / used);
  const extra = total % used;
  return Array.from({ length: used }, (_, i) => base + (i >= used - extra ? 1 : 0));
}

// Card size from its long side and width/height ratio, plus the centre and the
// radius available for letters. Letters are positioned inside the border.
export function cardGeometry(longSide, ratio) {
  const width = ratio >= 1 ? longSide : longSide * ratio;
  const height = ratio >= 1 ? longSide / ratio : longSide;
  const cx = (width - 2 * BORDER_MM) / 2;
  const cy = (height - 2 * BORDER_MM) / 2;
  return { width, height, cx, cy, available: Math.min(cx, cy) - EDGE_MARGIN };
}

// Radius and font size for each ring at font scale k (k = 1 is the size the
// sliders ask for). Rings go outward so that neither neighbouring rings nor
// neighbouring letters in a ring can touch.
export function layoutRings(numRings, perRing, baseEm, scaleFactor, k) {
  const rings = [];
  for (let i = 0; i < numRings; i++) {
    const font = baseEm * Math.pow(scaleFactor, i) * k;
    const prev = rings[i - 1];
    const count = countOf(perRing, i);
    const fitsNeighbours = count >= 2 ? (MIN_SPACING * font) / (2 * Math.sin(Math.PI / count)) : 0;
    const clearsInside = prev
      ? prev.radius + GLYPH_REACH * (prev.font + font) + RING_GAP * font
      : CENTER_CLEAR + GLYPH_REACH * font;
    rings.push({ font, radius: Math.max(fitsNeighbours, clearsInside) });
  }
  return rings;
}

export function outerExtent(rings) {
  const last = rings[rings.length - 1];
  return last.radius + GLYPH_REACH * last.font;
}

// Shrink every letter by the same factor (keeping the size progression) until
// the outermost ring fits within `available`. Returns the factor and the rings.
export function fitRings(numRings, perRing, baseEm, scaleFactor, available) {
  const at = k => layoutRings(numRings, perRing, baseEm, scaleFactor, k);
  if (outerExtent(at(1)) <= available) return { k: 1, rings: at(1) };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (outerExtent(at(mid)) > available) hi = mid; else lo = mid;
  }
  return { k: lo, rings: at(lo) };
}

// Pick letters for every ring and place them around it with a little wobble. With `noRepeats`, letters are
// dealt from the pool across the whole card, so none appears twice until the pool has been used up; otherwise
// each ring is picked on its own and the same letter can appear in several rings.
// Returns [{ letter, font, x, y, ring, angle, r }] with x and y measured from the inside corner of the card.
// `ring` is the ring's index, innermost first, and `angle` and `r` are the letter's position round the centre
// (cx, cy), so a ring can be turned (see motion.js).
export function placeLetters(rings, perRing, cx, cy, pool, random = Math.random, { noRepeats = false } = {}) {
  const placed = [];
  const counts = rings.map((_, i) => countOf(perRing, i));
  const dealt = noRepeats ? dealLetters(pool, counts, random) : null;

  rings.forEach(({ radius, font }, ringIndex) => {
    const angleStep = (2 * Math.PI) / counts[ringIndex];
    const letters = dealt ? dealt[ringIndex] : pickLetters(pool, counts[ringIndex], random);
    const baseAngle = random() * 2 * Math.PI; // new rotation each generation
    const wobble = () => (random() - 0.5) * JITTER * font;

    letters.forEach((letter, i) => {
      const angle = baseAngle + angleStep * i + wobble() / radius;
      const r = radius + wobble();
      placed.push({ letter, font, ring: ringIndex, angle, r, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  });
  return placed;
}
