// Maths for the matched Hart pair: one letter grid laid out twice, a small chart and a larger one. No DOM
// access, so it can be tested. The grid itself comes from shared/hart-grid.js.

import { gridLayout } from '../shared/hart-grid.js';

// How many times taller the large chart's letters are than the small chart's. The page's slider repeats these,
// and a test checks they agree.
export const RATIO = { min: 1.25, max: 6, step: 0.25, value: 1.5 };

export const largeHeightMm = (smallHeightMm, ratio) => smallHeightMm * ratio;

// The layout of both charts for the same rows, letters per row, spacing and numbers. The large chart is the
// small one with every letter, and so every cell, `ratio` times bigger.
export function pairLayouts({ rows, cols, smallHeightMm, ratio, spacing, numbers, colNumbers }) {
  const common = { rows, cols, spacing, numbers, colNumbers };
  return {
    small: gridLayout({ ...common, heightMm: smallHeightMm }),
    large: gridLayout({ ...common, heightMm: largeHeightMm(smallHeightMm, ratio) }),
  };
}
