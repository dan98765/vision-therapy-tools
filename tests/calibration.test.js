import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOX_RANGE,
  CUSTOM_MM_DEFAULT,
  CUSTOM_MM_MAX,
  CUSTOM_MM_MIN,
  NOMINAL_PX_PER_MM,
  REFERENCES,
  boxWidthRange,
  calibrationStatus,
  clampWidth,
  describeCalibration,
  isStale,
  mmToPx,
  nominalWidthPx,
  pxPerMm,
  pxToMm,
  referenceLength,
  restoredCalibration,
  stepPrecisionPercent,
} from '../shared/calibration.js';
import { inchesToMm, mmToInches } from '../shared/units.js';

describe('the browser assumption', () => {
  it('is 96 CSS pixels per inch', () => {
    expect(NOMINAL_PX_PER_MM * 25.4).toBeCloseTo(96, 10);
    expect(NOMINAL_PX_PER_MM).toBeCloseTo(3.7795, 4);
  });

  it('gives the width an object would have if the screen followed it', () => {
    expect(nominalWidthPx(85.6)).toBeCloseTo(323.54, 1); // a card
    expect(nominalWidthPx(25.4)).toBeCloseTo(96, 10); // one inch
  });
});

describe('pxPerMm and friends', () => {
  it('is the matched width divided by the real length', () => {
    expect(pxPerMm(340, 85.6)).toBeCloseTo(3.9720, 3);
    expect(pxPerMm(nominalWidthPx(85.6), 85.6)).toBeCloseTo(NOMINAL_PX_PER_MM, 10);
  });

  it('converts both ways', () => {
    const ppmm = 3.97;
    expect(pxToMm(mmToPx(37.5, ppmm), ppmm)).toBeCloseTo(37.5, 10);
    expect(mmToPx(100, ppmm)).toBeCloseTo(397, 10);
  });

  it('rejects numbers that cannot be a size', () => {
    for (const bad of [0, -5, NaN, Infinity, undefined]) {
      expect(() => pxPerMm(bad, 85.6), String(bad)).toThrow(RangeError);
      expect(() => pxPerMm(300, bad), String(bad)).toThrow(RangeError);
    }
    expect(() => pxToMm(10, 0)).toThrow(RangeError);
    expect(() => nominalWidthPx(-1)).toThrow(RangeError);
    expect(() => stepPrecisionPercent(0)).toThrow(RangeError);
    expect(() => describeCalibration(0)).toThrow(RangeError);
  });

  it('says how much one pixel matters', () => {
    expect(stepPrecisionPercent(400)).toBeCloseTo(0.25, 10);
    expect(stepPrecisionPercent(800)).toBeLessThan(stepPrecisionPercent(300));
  });
});

describe('the box slider range', () => {
  it('spans half to double the width the browser would assume, in whole pixels', () => {
    const range = boxWidthRange(85.6); // nominal 323.54 px
    expect(range).toEqual({ min: 161, max: 648 });
    expect(Number.isInteger(range.min) && Number.isInteger(range.max)).toBe(true);
  });

  it('always contains the browser assumption and any plausible real screen', () => {
    for (const mm of [10, 85.6, 210, 215.9, 400]) {
      const range = boxWidthRange(mm);
      const nominal = nominalWidthPx(mm);
      expect(range.min).toBeLessThanOrEqual(nominal * BOX_RANGE.min);
      expect(range.max).toBeGreaterThanOrEqual(nominal * BOX_RANGE.max);
      // screens from 60 to 500 pixels per inch are all inside
      for (const ppi of [60, 96, 163, 220, 326, 500]) {
        const width = (ppi / 25.4) * mm;
        if (ppi / 96 >= BOX_RANGE.min && ppi / 96 <= BOX_RANGE.max) expect(width).toBeGreaterThanOrEqual(range.min);
      }
    }
  });

  it('clamps a width into the range and leaves one inside it alone', () => {
    const range = { min: 100, max: 200 };
    expect(clampWidth(150.5, range)).toBe(150.5);
    expect(clampWidth(50, range)).toBe(100);
    expect(clampWidth(500, range)).toBe(200);
    expect(clampWidth(100, range)).toBe(100);
    expect(clampWidth(200, range)).toBe(200);
  });
});

describe('describeCalibration', () => {
  it('reports no error when the screen follows the CSS definition', () => {
    const d = describeCalibration(NOMINAL_PX_PER_MM);
    expect(d.pxPerInch).toBeCloseTo(96, 8);
    expect(d.cssLengthTooSmallPercent).toBeCloseTo(0, 8);
  });

  it('says CSS millimetres are too small when the screen has more pixels per mm than assumed', () => {
    const d = describeCalibration(NOMINAL_PX_PER_MM * 1.25); // 25% more pixels per real mm
    expect(d.cssLengthTooSmallPercent).toBeCloseTo(20, 8); // a CSS mm is 1/1.25 = 80% of a real mm
  });

  it('says CSS millimetres are too large when it has fewer', () => {
    expect(describeCalibration(NOMINAL_PX_PER_MM * 0.8).cssLengthTooSmallPercent).toBeCloseTo(-25, 8);
  });

  it('draws a length true to size by using pixels per real mm, not CSS mm', () => {
    const ppmm = NOMINAL_PX_PER_MM * 1.25;
    expect(pxToMm(mmToPx(50, ppmm), ppmm)).toBeCloseTo(50, 10);
    // a width styled "50mm" in CSS is only 50 / 1.25 = 40 real mm on this screen
    expect(pxToMm(mmToPx(50, NOMINAL_PX_PER_MM), ppmm)).toBeCloseTo(40, 8);
  });
});

describe('isStale and calibrationStatus', () => {
  it('notices a zoom or display change but not rounding noise', () => {
    expect(isStale(1, 1)).toBe(false);
    expect(isStale(1, 1.0001)).toBe(false);
    expect(isStale(1, 1.25)).toBe(true);
    expect(isStale(2, 1)).toBe(true);
  });

  it('is unadjusted until the user has matched the box, whatever the zoom does', () => {
    expect(calibrationStatus({ adjusted: false, calibratedRatio: 1, currentRatio: 1 })).toBe('unadjusted');
    expect(calibrationStatus({ adjusted: false, calibratedRatio: 1, currentRatio: 2 })).toBe('unadjusted');
  });

  it('is calibrated after matching, and stale once the zoom or display changes', () => {
    expect(calibrationStatus({ adjusted: true, calibratedRatio: 1.25, currentRatio: 1.25 })).toBe('calibrated');
    expect(calibrationStatus({ adjusted: true, calibratedRatio: 1.25, currentRatio: 1 })).toBe('stale');
  });
});

describe('references', () => {
  it('has the standard sizes', () => {
    expect(REFERENCES.card.mm).toBe(85.6);
    expect(REFERENCES.card.heightMm).toBe(53.98);
    expect(REFERENCES.a4.mm).toBe(210);
    expect(REFERENCES.letter.mm).toBeCloseTo(8.5 * 25.4, 8);
  });

  it('uses a built-in length as it is', () => {
    expect(referenceLength('card')).toBe(85.6);
    expect(referenceLength('a4', 999)).toBe(210);
  });

  it('keeps a custom length in a sensible range and falls back when it is not a number', () => {
    expect(referenceLength('custom', '120.5')).toBe(120.5);
    expect(referenceLength('custom', 1)).toBe(CUSTOM_MM_MIN);
    expect(referenceLength('custom', 9999)).toBe(CUSTOM_MM_MAX);
    for (const blank of ['', '   ', null, undefined, 'abc']) {
      expect(referenceLength('custom', blank), String(blank)).toBe(CUSTOM_MM_DEFAULT);
    }
  });

  it('rejects an unknown reference', () => {
    expect(() => referenceLength('banana')).toThrow(RangeError);
  });
});

describe('restoredCalibration', () => {
  it('accepts a calibration inside the range the slider can reach', () => {
    const saved = { ppmm: 4.2, ratio: 1.25 };
    expect(restoredCalibration(saved)).toEqual(saved);
    expect(restoredCalibration({ ppmm: NOMINAL_PX_PER_MM * BOX_RANGE.min, ratio: 1 })).not.toBeNull();
    expect(restoredCalibration({ ppmm: NOMINAL_PX_PER_MM * BOX_RANGE.max, ratio: 1 })).not.toBeNull();
  });

  it('ignores one outside that range, or with a ratio that cannot be real', () => {
    for (const bad of [
      { ppmm: NOMINAL_PX_PER_MM * 0.4, ratio: 1 },
      { ppmm: NOMINAL_PX_PER_MM * 2.1, ratio: 1 },
      { ppmm: 0, ratio: 1 },
      { ppmm: -3, ratio: 1 },
      { ppmm: 4, ratio: 0 },
      { ppmm: 4, ratio: 50 },
    ]) {
      expect(restoredCalibration(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it('ignores anything that is not a pair of numbers', () => {
    for (const bad of [null, undefined, 'text', 5, [], {}, { ppmm: '4', ratio: 1 }, { ppmm: 4 }, { ppmm: NaN, ratio: 1 }, { ppmm: 4, ratio: Infinity }]) {
      expect(restoredCalibration(bad), String(bad)).toBeNull();
    }
  });

  it('keeps a restored calibration stale when the zoom or display differs from when it was made', () => {
    const { ratio } = restoredCalibration({ ppmm: 4, ratio: 1.25 });
    expect(calibrationStatus({ adjusted: true, calibratedRatio: ratio, currentRatio: 1.25 })).toBe('calibrated');
    expect(calibrationStatus({ adjusted: true, calibratedRatio: ratio, currentRatio: 1 })).toBe('stale');
  });
});

// The page repeats a few of these facts (the wording of each reference, the limits, the slider's starting
// values). Check they agree so one cannot be changed without the other.
describe('the page and the shared maths agree', () => {
  const html = readFileSync(join(resolve(import.meta.dirname, '..'), 'screen-calibration', 'index.html'), 'utf8');
  const attribute = (id, name) => html.match(new RegExp(`id="${id}"[^>]*\\s${name}="([^"]*)"`))?.[1];

  it('offers exactly the references the maths knows, each with its length in the wording', () => {
    const options = [...html.matchAll(/<option value="(\w+)"[^>]*>([^<]+)<\/option>/g)].map(m => ({ key: m[1], text: m[2] }));
    expect(options.map(o => o.key)).toEqual(Object.keys(REFERENCES));
    for (const { key, text } of options) {
      if (REFERENCES[key].mm === null) continue;
      const inches = Number(mmToInches(REFERENCES[key].mm).toFixed(2)); // 3.37, 8.27, 8.5
      expect(text, key).toContain(`${inches} in`);
    }
  });

  it('starts on the card', () => {
    expect(html).toMatch(/<option value="card" selected>/);
  });

  it('limits the custom length (typed in inches) the same way', () => {
    expect(inchesToMm(Number(attribute('custom-length', 'min')))).toBeCloseTo(CUSTOM_MM_MIN, 8);
    expect(inchesToMm(Number(attribute('custom-length', 'max')))).toBeCloseTo(CUSTOM_MM_MAX, 8);
    expect(inchesToMm(Number(attribute('custom-length', 'value')))).toBeCloseTo(CUSTOM_MM_DEFAULT, 8);
  });

  it('starts the slider where the code would put it for a card', () => {
    const range = boxWidthRange(REFERENCES.card.mm);
    expect(Number(attribute('box-width', 'min'))).toBe(range.min);
    expect(Number(attribute('box-width', 'max'))).toBe(range.max);
    // the browser assumption, snapped to the slider's half-pixel steps
    expect(Number(attribute('box-width', 'value'))).toBe(Math.round(nominalWidthPx(REFERENCES.card.mm) * 2) / 2);
  });
});
