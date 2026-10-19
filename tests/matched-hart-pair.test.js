import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { gridLayout } from '../shared/hart-grid.js';
import { LENGTH_CONTROLS } from '../matched-hart-pair/lengths.js';
import { RATIO, largeHeightMm, pairLayouts } from '../matched-hart-pair/pair.js';
import { pageFit, pageNote } from '../shared/paper.js';

const DEFAULTS = { rows: 10, cols: 10, smallHeightMm: 4.064, ratio: 1.5, spacing: 2.5, numbers: false, colNumbers: false };

describe('pairLayouts', () => {
  it('lays the large chart out as the small one with every letter and cell the ratio times bigger', () => {
    for (const ratio of [1.25, 1.5, 2, 3.75, 6]) {
      const { small, large } = pairLayouts({ ...DEFAULTS, ratio });
      for (const key of ['fontMm', 'cellW', 'cellH', 'chartW', 'chartH']) {
        expect(large[key], key).toBeCloseTo(small[key] * ratio, 8);
      }
    }
  });

  it('keeps the rows, columns, numbers and spacing the same in both, including the number rows and columns', () => {
    const { small, large } = pairLayouts({ ...DEFAULTS, numbers: true, colNumbers: true, ratio: 2 });
    expect(large.numW).toBeCloseTo(small.numW * 2, 8);
    const plain = pairLayouts({ ...DEFAULTS, ratio: 2 });
    expect(small.chartH).toBeCloseTo(plain.small.chartH + 2 * small.cellH, 8); // two rows of column numbers
    expect(large.chartW).toBeCloseTo(plain.large.chartW + 2 * large.numW, 8);
  });

  it('gives the small chart exactly what a Hart chart of that height would have', () => {
    const { small } = pairLayouts(DEFAULTS);
    expect(small).toEqual(gridLayout({ rows: 10, cols: 10, heightMm: 4.064, spacing: 2.5, numbers: false, colNumbers: false }));
  });

  it('is its own big chart when the ratio is one', () => {
    const { small, large } = pairLayouts({ ...DEFAULTS, ratio: 1 });
    expect(large).toEqual(small);
  });

  it('multiplies a letter height by the ratio', () => {
    expect(largeHeightMm(4, 1.5)).toBe(6);
    expect(largeHeightMm(2, 6)).toBe(12);
  });
});

describe('the default pair prints', () => {
  it('has a small chart that fits upright and a large chart that fits sideways, on Letter and A4', () => {
    const { small, large } = pairLayouts(DEFAULTS);
    expect(pageFit(small.chartW, small.chartH)).toBe('portrait');
    expect(pageFit(large.chartW, large.chartH)).toBe('landscape');
  });

  it('with row and column numbers on, the large chart runs onto a second page, and says so rather than warning', () => {
    const { small, large } = pairLayouts({ ...DEFAULTS, numbers: true, colNumbers: true });
    expect(pageFit(small.chartW, small.chartH)).not.toBe('none');
    expect(pageFit(large.chartW, large.chartH)).toBe('none'); // too tall for one sideways page
    const note = pageNote(large.chartW, large.chartH, { rowsStayWhole: true });
    expect(note.warn).toBe(false);
    expect(note.text).toMatch(/landscape/);
    expect(note.text).toMatch(/more pages/);
  });
});

// The page repeats the ratio's limits and the small height's range. Check they agree with the maths.
describe('the page and the pair maths agree', () => {
  const html = readFileSync(join(resolve(import.meta.dirname, '..'), 'matched-hart-pair', 'index.html'), 'utf8');
  const attribute = (id, name) => Number(html.match(new RegExp(`id="${id}"[^>]*\\s${name}="([^"]*)"`))?.[1]);

  it('has the same size ratio range, step and default', () => {
    expect(attribute('size-ratio', 'min')).toBe(RATIO.min);
    expect(attribute('size-ratio', 'max')).toBe(RATIO.max);
    expect(attribute('size-ratio', 'step')).toBe(RATIO.step);
    expect(attribute('size-ratio', 'value')).toBe(RATIO.value);
  });

  it('starts the small chart where its inch definition says', () => {
    const { min, max, step, value } = LENGTH_CONTROLS['small-height'].in;
    expect([attribute('small-height', 'min'), attribute('small-height', 'max'), attribute('small-height', 'step'), attribute('small-height', 'value')]).toEqual([min, max, step, value]);
  });

  it('starts with a default letter height and ratio that give the large chart the readout the page shows', () => {
    // 0.16 in x 1.5 = 0.24 in, as the initial readout says
    expect(html).toContain('1.50× (letters 0.24 in)');
    expect(LENGTH_CONTROLS['small-height'].in.value * RATIO.value).toBeCloseTo(0.24, 10);
  });

  it('has a print button for each chart, and each chart box the print rules hide', () => {
    expect(html).toContain('id="btn-print-small"');
    expect(html).toContain('id="btn-print-large"');
    expect(html).toContain('class="pair-chart pair-small"');
    expect(html).toContain('class="pair-chart pair-large"');
    const css = readFileSync(join(resolve(import.meta.dirname, '..'), 'matched-hart-pair', 'style.css'), 'utf8');
    expect(css).toContain('body[data-print="small"] .pair-large');
    expect(css).toContain('body[data-print="large"] .pair-small');
  });
});
