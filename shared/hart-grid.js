// Grid maths for the Hart chart and the matched pair. No DOM access, so it can be tested.
// All lengths are in mm; "em" means the font-size of the letters.

import { sizeSummary } from './format.js';
import { CAP_HEIGHT, MIN_LETTER_MM, UPPER, UPPER_CONSONANTS } from './letters.js';
import { pageNote } from './paper.js';

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
// the overall chart size, plus whether the letters are too small to read.
// `numbers` adds a row-number column on each side; `colNumbers` adds a row of column numbers above and below.
export function gridLayout({ rows, cols, heightMm, spacing, numbers, colNumbers = false }) {
  const fontMm = heightMm / CAP_HEIGHT;
  const cellW = fontMm * spacing;
  const cellH = fontMm * spacing * 0.8;
  const numW = numbers ? cellW * 0.8 : 0;
  const chartW = cols * cellW + numW * 2;
  const chartH = (rows + (colNumbers ? 2 : 0)) * cellH;
  return {
    fontMm,
    cellW,
    cellH,
    numW,
    chartW,
    chartH,
    tooSmall: heightMm < MIN_LETTER_MM,
  };
}

// What the note under a chart says, in `units`: its size, how it will print (a chart can continue onto more
// pages, row by row), and a warning if the letters are too small to read. `layout` comes from gridLayout.
// Returns { text, warn }.
export function chartNote(layout, units) {
  const page = pageNote(layout.chartW, layout.chartH, { rowsStayWhole: true, units });
  return {
    text:
      sizeSummary(layout.chartW, layout.chartH, units) +
      page.text +
      (layout.tooSmall ? ' Warning: letters this small may be too small to read.' : ''),
    warn: page.warn || layout.tooSmall,
  };
}
