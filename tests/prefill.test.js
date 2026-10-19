import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LENGTH_CONTROLS as CARD_LENGTHS } from '../macdonald-form-field-cards/lengths.js';
import { LENGTH_CONTROLS as HART_LENGTHS } from '../hart-chart/lengths.js';
import { LENGTH_CONTROLS as PAIR_LENGTHS } from '../matched-hart-pair/lengths.js';
import { controlValueFromMm } from '../shared/lengths.js';
import { PREFILL_PAGES, PREFILL_PARAM, letterLink, parseLetterMm, prefillMessage } from '../shared/prefill.js';
import { UNITS } from '../shared/units.js';

describe('letterLink', () => {
  it('carries the height in millimetres to three decimals, and nothing else', () => {
    expect(letterLink('../hart-chart/', 6.35)).toBe('../hart-chart/?letter-mm=6.350');
    expect(letterLink('../hart-chart/', 3.4932)).toBe('../hart-chart/?letter-mm=3.493');
    expect(PREFILL_PARAM).toBe('letter-mm');
  });

  it('makes a link its own parser reads back', () => {
    for (const mm of [0.25, 1, 3.5, 6.35, 12.7, 600]) {
      const link = letterLink('./x/', mm);
      expect(parseLetterMm(link.slice(link.indexOf('?')))).toBeCloseTo(mm, 3);
    }
  });
});

describe('parseLetterMm', () => {
  it('reads a plain positive length', () => {
    expect(parseLetterMm('?letter-mm=6.35')).toBe(6.35);
    expect(parseLetterMm('?letter-mm=6')).toBe(6);
    expect(parseLetterMm('?other=1&letter-mm=3.493')).toBe(3.493);
    expect(parseLetterMm('?letter-mm=1000')).toBe(1000);
  });

  it('ignores a link without one', () => {
    for (const none of ['', '?', '?other=5', '?letter-mm=', '?letter=6']) expect(parseLetterMm(none), none).toBeNull();
  });

  it('refuses anything that is not written the way the calculator writes a length', () => {
    for (const bad of [
      '?letter-mm=0', '?letter-mm=-5', '?letter-mm=abc', '?letter-mm=1e2', '?letter-mm=0x10', '?letter-mm=NaN',
      '?letter-mm=Infinity', '?letter-mm=1001', '?letter-mm=99999', '?letter-mm=6.35.1', '?letter-mm=.5',
      '?letter-mm=5.', '?letter-mm=%205', '?letter-mm=5%20', '?letter-mm=5,5', '?letter-mm=0.0000001',
      '?letter-mm=<script>', '?letter-mm=6.35"onmouseover="x',
    ]) {
      expect(parseLetterMm(bad), bad).toBeNull();
    }
  });

  it('uses only the first value when a link repeats it', () => {
    expect(parseLetterMm('?letter-mm=5&letter-mm=9')).toBe(5);
    expect(parseLetterMm('?letter-mm=abc&letter-mm=9')).toBeNull();
  });
});

describe('prefillMessage', () => {
  const spec = HART_LENGTHS['letter-height'];

  it('says the height was set, when the control can show it', () => {
    expect(prefillMessage(5.08, 0.2, 'in', spec.in)).toBe('Letter height set to 0.20 in, from the letter size calculator.');
    expect(prefillMessage(5, 5, 'mm', spec.mm)).toBe('Letter height set to 5.0 mm, from the letter size calculator.');
  });

  it('says so when the control had to move it, with what was asked for and what it is now', () => {
    const tooBig = prefillMessage(100, 30, 'mm', spec.mm);
    expect(tooBig).toContain('asked for 100.00 mm');
    expect(tooBig).toContain('outside the range this page can make');
    expect(tooBig).toContain('nearest it can do, 30.0 mm');
    expect(prefillMessage(0.5, 0.08, 'in', spec.in)).toContain('asked for 0.020 in');
    expect(prefillMessage(0.5, 0.08, 'in', spec.in)).toContain('nearest it can do, 0.08 in');
  });
});

// The calculator links to these pages; each must really take a link and have somewhere to say so
describe('every page the calculator links to', () => {
  const root = resolve(import.meta.dirname, '..');
  const controls = {
    'hart-chart': HART_LENGTHS['letter-height'],
    'matched-hart-pair': PAIR_LENGTHS['small-height'],
    'macdonald-form-field-cards': CARD_LENGTHS['base-letter'],
  };

  it('is listed once, and is a page of the site', () => {
    expect(new Set(PREFILL_PAGES).size).toBe(PREFILL_PAGES.length);
    expect(Object.keys(controls).sort()).toEqual([...PREFILL_PAGES].sort());
  });

  for (const folder of PREFILL_PAGES) {
    it(`${folder}: has a hidden note for the message, and its script applies the link`, () => {
      const html = readFileSync(join(root, folder, 'index.html'), 'utf8');
      const main = readFileSync(join(root, folder, 'main.js'), 'utf8');
      expect(html).toContain('id="prefill-note" hidden');
      expect(main).toContain('applyLetterPrefill(');
      expect(main).toContain('remember.save()');
    });

    it(`${folder}: a linked height always lands inside the control's range and on its steps, in both units`, () => {
      for (const units of UNITS) {
        const { min, max, step } = controls[folder][units];
        for (const mm of [0.1, 0.5, 1, 3.493, 5, 6.35, 12.7, 100, 1000]) {
          const value = controlValueFromMm(mm, units, { [units]: controls[folder][units] });
          expect(value, `${mm} mm in ${units}`).toBeGreaterThanOrEqual(min);
          expect(value, `${mm} mm in ${units}`).toBeLessThanOrEqual(max);
          const steps = (value - min) / step;
          expect(Math.abs(steps - Math.round(steps)), `${mm} mm in ${units}`).toBeLessThan(1e-6);
        }
      }
    });
  }
});
