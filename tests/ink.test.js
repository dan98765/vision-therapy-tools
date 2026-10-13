// The layout tests rely on tests/ink.js to notice clipping and overlap, so check that it does.
import { describe, expect, it } from 'vitest';
import { boxesOverlap, inkBox, layoutProblem } from './ink.js';

describe('the ink helper the layout tests use', () => {
  const geo = { cx: 50, cy: 50 }; // a card whose usable area is 100 x 100
  const left = inkBox(30, 50, 10, 0.1);

  it('makes a box as wide as the widest capital plus the margin, centred on the letter', () => {
    const box = inkBox(30, 50, 10, 0.1);
    expect(box.right - box.left).toBeCloseTo(10.4, 10); // (0.94 + 0.1) em
    expect((box.left + box.right) / 2).toBeCloseTo(30, 10);
    expect((box.top + box.bottom) / 2).toBeCloseTo(50, 10);
  });

  it('sees overlapping boxes, and not ones with a gap between them', () => {
    expect(boxesOverlap(left, inkBox(36, 50, 10, 0.1))).toBe(true);
    expect(boxesOverlap(left, inkBox(30 + 10.5, 50, 10, 0.1))).toBe(false); // a box is 10.4 wide
  });

  it('reports overlap, clipping, or nothing', () => {
    expect(layoutProblem([left, inkBox(36, 50, 10, 0.1)], geo)).toBe('overlap');
    expect(layoutProblem([left, inkBox(98, 50, 10, 0.1)], geo)).toBe('clipped');
    expect(layoutProblem([left, inkBox(70, 50, 10, 0.1)], geo)).toBeNull();
  });

  it('can be told to look at only some pairs, but still checks every box against the card edge', () => {
    const touching = [left, inkBox(36, 50, 10, 0.1)];
    expect(layoutProblem(touching, geo, () => false)).toBeNull();
    expect(layoutProblem([left, inkBox(98, 50, 10, 0.1)], geo, () => false)).toBe('clipped');
  });
});
