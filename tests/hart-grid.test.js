import { describe, expect, it } from 'vitest';
import { pageFit } from '../shared/paper.js';
import { LETTER_SETS, buildGrid, chartNote, gridLayout } from '../shared/hart-grid.js';
import { seeded } from './rng.js';

// Page defaults from hart-chart/index.html
const DEFAULTS = { rows: 10, cols: 10, heightMm: 5, spacing: 2.5, numbers: false };

describe('buildGrid', () => {
  it('makes a grid of the requested size from the chosen letters', () => {
    for (const [name, pool] of Object.entries(LETTER_SETS)) {
      const grid = buildGrid(8, 6, pool, seeded(1));
      expect(grid, name).toHaveLength(8);
      for (const row of grid) {
        expect(row).toHaveLength(6);
        for (const letter of row) expect(pool).toContain(letter);
      }
    }
  });

  it('never repeats a letter next to or below itself', () => {
    for (const pool of Object.values(LETTER_SETS)) {
      for (const [rows, cols] of [[4, 4], [24, 16], [12, 10]]) {
        for (let seed = 0; seed < 20; seed++) {
          const grid = buildGrid(rows, cols, pool, seeded(seed));
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (c > 0) expect(grid[r][c]).not.toBe(grid[r][c - 1]);
              if (r > 0) expect(grid[r][c]).not.toBe(grid[r - 1][c]);
            }
          }
        }
      }
    }
  });

  it('keeps consonant sets free of vowels', () => {
    const grid = buildGrid(10, 10, LETTER_SETS['upper-consonants'], seeded(2));
    expect(grid.flat().some(letter => 'AEIOU'.includes(letter))).toBe(false);
    const lower = buildGrid(10, 10, LETTER_SETS['lower-consonants'], seeded(2));
    expect(lower.flat().some(letter => 'aeiou'.includes(letter))).toBe(false);
  });

  it('is repeatable with the same seed', () => {
    const pool = LETTER_SETS.upper;
    expect(buildGrid(5, 5, pool, seeded(9))).toEqual(buildGrid(5, 5, pool, seeded(9)));
  });
});

describe('chartNote', () => {
  it('gives the size and nothing else for a chart that fits upright', () => {
    const note = chartNote(gridLayout(DEFAULTS), 'in');
    expect(note.text).toBe('6.87 × 5.50 in. Print at 100% / "Actual size" to keep this size.');
    expect(note.warn).toBe(false);
  });

  it('writes the size in the units asked for', () => {
    expect(chartNote(gridLayout(DEFAULTS), 'mm').text).toMatch(/^175 × 140 mm\./);
  });

  it('says a chart that only fits sideways, or runs onto more pages, without a warning', () => {
    const sideways = chartNote(gridLayout({ ...DEFAULTS, numbers: true }), 'in');
    expect(sideways.text).toMatch(/Print in landscape\./);
    expect(sideways.warn).toBe(false);
    const tall = chartNote(gridLayout({ ...DEFAULTS, rows: 24 }), 'in');
    expect(tall.text).toMatch(/more pages/);
    expect(tall.warn).toBe(false);
  });

  it('warns when the chart is too wide to print, in either units', () => {
    const wide = gridLayout({ ...DEFAULTS, heightMm: 30 });
    expect(chartNote(wide, 'in').warn).toBe(true);
    expect(chartNote(wide, 'in').text).toContain('(about 7.2 in × 10.0 in)');
    expect(chartNote(wide, 'mm').text).toContain('(about 184 mm × 254 mm)');
  });

  it('warns when the letters are too small to read', () => {
    const tiny = gridLayout({ ...DEFAULTS, heightMm: 1 });
    expect(chartNote(tiny, 'in')).toEqual({ text: expect.stringContaining('too small to read'), warn: true });
  });
});

describe('gridLayout', () => {
  it('sizes the default chart to fit one page', () => {
    const layout = gridLayout(DEFAULTS);
    expect(layout.chartW).toBeCloseTo(174.7, 0);
    expect(layout.chartH).toBeCloseTo(139.7, 0);
    expect(pageFit(layout.chartW, layout.chartH)).toBe('portrait');
    expect(layout.tooSmall).toBe(false);
  });

  it('adds a row-number column on each side when numbers are shown', () => {
    const plain = gridLayout(DEFAULTS);
    const numbered = gridLayout({ ...DEFAULTS, numbers: true });
    expect(numbered.chartW).toBeCloseTo(plain.chartW + 2 * numbered.numW);
    expect(numbered.chartH).toBeCloseTo(plain.chartH);
  });

  it('adds a row of column numbers above and below when they are shown', () => {
    const plain = gridLayout(DEFAULTS);
    const numbered = gridLayout({ ...DEFAULTS, colNumbers: true });
    expect(numbered.chartH).toBeCloseTo(plain.chartH + 2 * numbered.cellH);
    expect(numbered.chartW).toBeCloseTo(plain.chartW);
  });

  it('needs a sideways page when the row numbers make it too wide', () => {
    const layout = gridLayout({ ...DEFAULTS, numbers: true });
    expect(pageFit(layout.chartW, layout.chartH)).toBe('landscape');
  });

  it('warns when letters are very small', () => {
    expect(gridLayout({ ...DEFAULTS, heightMm: 1.4 }).tooSmall).toBe(true);
    expect(gridLayout({ ...DEFAULTS, heightMm: 1.5 }).tooSmall).toBe(false);
  });
});
