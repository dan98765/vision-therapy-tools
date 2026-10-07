// Grid maths for the Hart chart. No DOM access, so it can be tested.
// All lengths are in mm; "em" means the font-size of the letters.

import { CAP_HEIGHT, MIN_LETTER_MM, UPPER, UPPER_CONSONANTS } from '../shared/letters.js';

export const PAGE_W_MM = 190; // printable width of Letter/A4 with ~10 mm margins
export const PAGE_H_MM = 250; // printable height of Letter/A4 with ~10 mm margins

export const LETTER_SETS = {
  'upper': UPPER,
  'upper-consonants': UPPER_CONSONANTS,
  'lower': UPPER.map(c => c.toLowerCase()),
  'lower-consonants': UPPER_CONSONANTS.map(c => c.toLowerCase()),
};

// A letter never matches its left or upper neighbour, so every jump of the
// eyes lands on a different letter.
export function buildGrid(rows, cols, pool, random = Math.random) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const banned = new Set([row[c - 1], grid[r - 1] && grid[r - 1][c]]);
      const options = pool.filter(letter => !banned.has(letter));
      row.push(options[Math.floor(random() * options.length)]);
    }
    grid.push(row);
  }
  return grid;
}

// Sizes for a chart: font size, cell size, the optional row-number columns and
// the overall chart size, plus whether it needs a warning.
export function gridLayout({ rows, cols, heightMm, spacing, numbers }) {
  const fontMm = heightMm / CAP_HEIGHT;
  const cellW = fontMm * spacing;
  const cellH = fontMm * spacing * 0.8;
  const numW = numbers ? cellW * 0.8 : 0;
  const chartW = cols * cellW + numW * 2;
  const chartH = rows * cellH;
  return {
    fontMm,
    cellW,
    cellH,
    numW,
    chartW,
    chartH,
    tooBig: chartW > PAGE_W_MM || chartH > PAGE_H_MM,
    tooSmall: heightMm < MIN_LETTER_MM,
  };
}
