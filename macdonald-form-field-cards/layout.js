// Layout maths for the Macdonald Form Field Cards. No DOM access, so it can be tested.
// All lengths are in mm; "em" means the font-size of the letter in question.

import { pickLetters } from '../shared/letters.js';

export const BORDER_MM = 0.8;    // card border width (the CSS reads this via --border-mm)
export const GLYPH_REACH = 0.6;  // how far a glyph extends from its center, in em
export const MIN_SPACING = 1.5;  // min distance between neighbours in a ring, in em
export const RING_GAP = 0.15;    // extra gap between rings, in em
export const JITTER = 0.1;       // random wobble of each letter, in em
export const CENTER_CLEAR = 3.5; // clear radius around the fixation circle
export const EDGE_MARGIN = 1;    // keep letters this far inside the border

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
    const fitsNeighbours = (MIN_SPACING * font) / (2 * Math.sin(Math.PI / perRing));
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

// Pick letters for every ring and place them around it with a little wobble.
// Returns [{ letter, font, x, y }] with x and y measured from the inside corner of the card.
export function placeLetters(rings, perRing, cx, cy, pool, random = Math.random) {
  const placed = [];
  const angleStep = (2 * Math.PI) / perRing;

  for (const { radius, font } of rings) {
    const letters = pickLetters(pool, perRing, random);
    const baseAngle = random() * 2 * Math.PI; // new rotation each generation
    const wobble = () => (random() - 0.5) * JITTER * font;

    letters.forEach((letter, i) => {
      const angle = baseAngle + angleStep * i + wobble() / radius;
      const r = radius + wobble();
      placed.push({ letter, font, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  }
  return placed;
}
