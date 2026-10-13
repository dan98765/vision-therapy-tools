// Shared by the tests that check letters on a card never clip or overlap.
// A letter's "ink box" is as wide as the widest capital (W, 0.94 em) and as tall as a capital, plus a margin
// so letters never nearly touch. `margin` is in em.
import { CAP_HEIGHT } from '../shared/letters.js';

const WIDEST_CAPITAL = 0.94;

export function inkBox(x, y, font, margin) {
  const halfW = ((WIDEST_CAPITAL + margin) * font) / 2;
  const halfH = ((CAP_HEIGHT + margin) * font) / 2;
  return { left: x - halfW, right: x + halfW, top: y - halfH, bottom: y + halfH };
}

export const boxesOverlap = (p, q) => p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom;

// 'clipped' if a box leaves the card (whose usable area is 2 * cx wide and 2 * cy tall), 'overlap' if two boxes
// overlap, otherwise null. `checkPair(i, j)` lets a test look at only some pairs.
export function layoutProblem(boxes, geo, checkPair = () => true) {
  for (const b of boxes) {
    if (b.left < 0 || b.top < 0 || b.right > 2 * geo.cx || b.bottom > 2 * geo.cy) return 'clipped';
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (checkPair(i, j) && boxesOverlap(boxes[i], boxes[j])) return 'overlap';
    }
  }
  return null;
}
