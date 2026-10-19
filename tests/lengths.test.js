import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LENGTH_CONTROLS as CALIBRATION_LENGTHS } from '../screen-calibration/lengths.js';
import { LENGTH_CONTROLS as CARD_LENGTHS } from '../macdonald-form-field-cards/lengths.js';
import { LENGTH_CONTROLS as HART_LENGTHS } from '../hart-chart/lengths.js';
import { LENGTH_CONTROLS as PAIR_LENGTHS } from '../matched-hart-pair/lengths.js';
import {
  controlValueFromMm,
  convertControlValue,
  fitToControl,
  mmFromControlValue,
  restoredControlValue,
  snapToControl,
} from '../shared/lengths.js';
import { UNITS, fromDisplay } from '../shared/units.js';

const spec = {
  in: { min: 0.08, max: 1.2, step: 0.02, value: 0.2, digits: 2 },
  mm: { min: 2, max: 30, step: 0.5, value: 5, digits: 1 },
};

describe('snapToControl', () => {
  it('moves a value onto the step grid counted from the minimum', () => {
    expect(snapToControl(0.213, spec.in)).toBe(0.22);
    expect(snapToControl(0.2, spec.in)).toBe(0.2);
    expect(snapToControl(5.3, spec.mm)).toBe(5.5);
    expect(snapToControl(5.2, spec.mm)).toBe(5);
  });

  it('keeps a value inside the range', () => {
    expect(snapToControl(0, spec.in)).toBe(0.08);
    expect(snapToControl(99, spec.in)).toBe(1.2);
    expect(snapToControl(-5, spec.mm)).toBe(2);
    expect(snapToControl(500, spec.mm)).toBe(30);
  });

  it('does not leave float noise behind', () => {
    for (let n = 0; n <= 56; n++) {
      const value = snapToControl(0.08 + n * 0.02, spec.in);
      expect(String(value).length, String(value)).toBeLessThanOrEqual(5); // such as 0.38, never 0.38000000000000006
    }
  });
});

describe('fitToControl', () => {
  const exact = {
    in: { min: 0.5, max: 16, step: 0.05, value: 4, digits: 2, exact: true },
    mm: { min: 10, max: 400, step: 0.5, value: 100, digits: 1, exact: true },
  };

  it('moves a slider value onto its steps but keeps an exact box\'s value, rounded to its decimals', () => {
    expect(fitToControl(4.72, spec.in)).toBe(1.2); // a slider stops at its top
    expect(fitToControl(4.724, exact.in)).toBe(4.72);
    expect(fitToControl(120.04, exact.mm)).toBe(120);
  });

  it('keeps an exact box inside its range', () => {
    expect(fitToControl(0.1, exact.in)).toBe(0.5);
    expect(fitToControl(99, exact.in)).toBe(16);
    expect(fitToControl(5, exact.mm)).toBe(10);
  });

  it('does not nudge a typed length when the units switch', () => {
    expect(convertControlValue(120, 'mm', 'in', exact)).toBe(4.72);
    expect(convertControlValue(4.72, 'in', 'mm', exact)).toBe(119.9);
    expect(restoredControlValue(120, 'mm', exact)).toBe(120);
    expect(restoredControlValue(120, 'in', exact)).toBe(4.72);
  });
});

describe('converting between units', () => {
  it('turns a length in millimetres into the value for either unit, on that unit\'s grid', () => {
    expect(controlValueFromMm(5.08, 'in', spec)).toBe(0.2);
    expect(controlValueFromMm(5, 'mm', spec)).toBe(5);
    expect(controlValueFromMm(25.4, 'in', spec)).toBe(1);
  });

  it('keeps what is showing when the user switches unit, within a step', () => {
    expect(convertControlValue(0.2, 'in', 'mm', spec)).toBe(5);
    expect(convertControlValue(5, 'mm', 'in', spec)).toBe(0.2);
    expect(convertControlValue(1.2, 'in', 'mm', spec)).toBe(30); // 30.48 mm is above the top, so it stops at 30
  });

  it('always lands on a step and inside the range, in both directions, for every value the control offers', () => {
    for (const [from, to] of [['in', 'mm'], ['mm', 'in']]) {
      const { min, max, step } = spec[from];
      for (let value = min; value <= max + 1e-9; value += step) {
        const converted = convertControlValue(Number(value.toFixed(3)), from, to, spec);
        const target = spec[to];
        expect(converted).toBeGreaterThanOrEqual(target.min);
        expect(converted).toBeLessThanOrEqual(target.max);
        const steps = (converted - target.min) / target.step;
        expect(Math.abs(steps - Math.round(steps)), `${value} ${from} -> ${converted} ${to}`).toBeLessThan(1e-6);
      }
    }
  });

  it('does not drift when switching back and forth', () => {
    let value = 0.34;
    for (let i = 0; i < 20; i++) {
      value = convertControlValue(value, 'in', 'mm', spec);
      value = convertControlValue(value, 'mm', 'in', spec);
    }
    expect(Math.abs(value - 0.34)).toBeLessThanOrEqual(0.02); // within one step, and settles
  });
});

describe('what is saved and restored', () => {
  it('saves a length in millimetres whichever unit was showing', () => {
    expect(mmFromControlValue(1, 'in')).toBe(25.4);
    expect(mmFromControlValue(5, 'mm')).toBe(5);
    expect(mmFromControlValue(0.2, 'in')).toBe(5.08);
  });

  it('restores it in whichever unit is showing now', () => {
    expect(restoredControlValue(5.08, 'in', spec)).toBe(0.2);
    expect(restoredControlValue(5.08, 'mm', spec)).toBe(5);
    expect(restoredControlValue(25.4, 'in', spec)).toBe(1);
  });

  it('ignores a saved value that is not a good length or does not fit the control', () => {
    for (const bad of [0, -3, NaN, Infinity, '5', null, undefined, {}, [5], 1, 31, 999]) {
      expect(restoredControlValue(bad, 'mm', spec), String(bad)).toBeUndefined();
    }
    expect(restoredControlValue(1, 'in', spec)).toBeUndefined(); // 1 mm is 0.04 in, below the 0.08 in minimum
  });

  it('accepts a value a rounding error outside the range', () => {
    expect(restoredControlValue(2.2, 'mm', spec)).toBe(2); // snapped to the step
    expect(restoredControlValue(30.2, 'mm', spec)).toBe(30);
  });

  it('keeps the old inch value working after a unit switch and a reload, for every length control', () => {
    for (const controls of [HART_LENGTHS, CARD_LENGTHS, PAIR_LENGTHS, CALIBRATION_LENGTHS]) {
      for (const [id, s] of Object.entries(controls)) {
        for (const units of UNITS) {
          const saved = mmFromControlValue(s[units].value, units);
          for (const showing of UNITS) {
            expect(restoredControlValue(saved, showing, s), `${id} saved in ${units}, shown in ${showing}`).toBeDefined();
          }
        }
      }
    }
  });
});

// The inch definition is what the HTML says when the page loads; the metric one is what the old
// millimetre sliders said. Check the page and the definitions agree, and that each definition is sound.
describe('each page\'s length controls', () => {
  const root = resolve(import.meta.dirname, '..');
  const pages = {
    'hart-chart': HART_LENGTHS,
    'macdonald-form-field-cards': CARD_LENGTHS,
    'matched-hart-pair': PAIR_LENGTHS,
    'screen-calibration': CALIBRATION_LENGTHS,
  };

  for (const [folder, controls] of Object.entries(pages)) {
    const html = readFileSync(join(root, folder, 'index.html'), 'utf8');
    const attribute = (id, name) => Number(html.match(new RegExp(`id="${id}"[^>]*\\s${name}="([^"]*)"`))?.[1]);

    for (const [id, s] of Object.entries(controls)) {
      it(`${folder} #${id}: the HTML starts as the inch definition says`, () => {
        for (const name of ['min', 'max', 'step', 'value']) expect(attribute(id, name), name).toBe(s.in[name]);
      });

      for (const units of UNITS) {
        it(`${folder} #${id}: the ${units} definition has a default inside its range, on its steps`, () => {
          const { min, max, step, value, digits } = s[units];
          expect(min).toBeLessThan(max);
          expect(value).toBeGreaterThanOrEqual(min);
          expect(value).toBeLessThanOrEqual(max);
          expect(fitToControl(value, s[units])).toBe(value);
          expect(String(value).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(digits);
          expect(step).toBeGreaterThan(0);
        });
      }

      it(`${folder} #${id}: the two units describe about the same range`, () => {
        for (const edge of ['min', 'max']) {
          const inMm = fromDisplay(s.in[edge], 'in');
          const mm = s.mm[edge];
          expect(Math.abs(inMm - mm) / mm, edge).toBeLessThan(0.3);
        }
        const defaultMm = fromDisplay(s.in.value, 'in');
        expect(Math.abs(defaultMm - s.mm.value) / s.mm.value).toBeLessThan(0.02);
      });
    }
  }
});
