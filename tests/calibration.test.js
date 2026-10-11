import { describe, expect, it } from 'vitest';
import {
  CUSTOM_MM_MAX,
  CUSTOM_MM_MIN,
  NOMINAL_PX_PER_MM,
  REFERENCES,
  describeCalibration,
  isStale,
  mmToPx,
  nominalWidthPx,
  pxPerMm,
  pxToMm,
  referenceLength,
  stepPrecisionPercent,
} from '../shared/calibration.js';
import { TICK_MM, rulerTicks } from '../screen-calibration/ruler.js';

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
  });

  it('says how much one pixel matters', () => {
    expect(stepPrecisionPercent(400)).toBeCloseTo(0.25, 10);
    expect(stepPrecisionPercent(800)).toBeLessThan(stepPrecisionPercent(300));
  });
});

describe('describeCalibration', () => {
  it('reports no error when the screen follows the CSS definition', () => {
    const d = describeCalibration(NOMINAL_PX_PER_MM);
    expect(d.pxPerInch).toBeCloseTo(96, 8);
    expect(d.hundredMmInPx).toBeCloseTo(377.95, 1);
    expect(d.cssMmTooSmallPercent).toBeCloseTo(0, 8);
  });

  it('says CSS millimetres are too small when the screen has more pixels per mm than assumed', () => {
    const d = describeCalibration(NOMINAL_PX_PER_MM * 1.25); // 25% more pixels per real mm
    expect(d.cssMmTooSmallPercent).toBeCloseTo(20, 8); // a CSS mm is 1/1.25 = 80% of a real mm
  });

  it('says CSS millimetres are too large when it has fewer', () => {
    expect(describeCalibration(NOMINAL_PX_PER_MM * 0.8).cssMmTooSmallPercent).toBeCloseTo(-25, 8);
  });

  it('draws a length true to size by using pixels per real mm, not CSS mm', () => {
    const ppmm = NOMINAL_PX_PER_MM * 1.25;
    const trueWidthMm = pxToMm(mmToPx(50, ppmm), ppmm);
    expect(trueWidthMm).toBeCloseTo(50, 10);
    // a width styled "50mm" in CSS is only 50 / 1.25 = 40 real mm on this screen
    expect(pxToMm(mmToPx(50, NOMINAL_PX_PER_MM), ppmm)).toBeCloseTo(40, 8);
  });
});

describe('isStale', () => {
  it('notices a zoom or display change but not rounding noise', () => {
    expect(isStale(1, 1)).toBe(false);
    expect(isStale(1, 1.0001)).toBe(false);
    expect(isStale(1, 1.25)).toBe(true);
    expect(isStale(2, 1)).toBe(true);
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
    expect(referenceLength('custom', '')).toBe(100); // an empty box is not a number
    expect(referenceLength('custom', '   ')).toBe(100);
    expect(referenceLength('custom', null)).toBe(100);
    expect(referenceLength('custom', 'abc')).toBe(100);
  });

  it('rejects an unknown reference', () => {
    expect(() => referenceLength('banana')).toThrow(RangeError);
  });
});

describe('rulerTicks', () => {
  const ticks = rulerTicks(150);

  it('has one tick per millimetre including both ends', () => {
    expect(ticks).toHaveLength(151);
    expect(ticks[0].mm).toBe(0);
    expect(ticks.at(-1).mm).toBe(150);
  });

  it('labels each centimetre and nothing else', () => {
    const labelled = ticks.filter(t => t.label);
    expect(labelled.map(t => t.label)).toEqual(Array.from({ length: 16 }, (_, i) => String(i)));
    expect(labelled.every(t => t.mm % 10 === 0 && t.kind === 'cm')).toBe(true);
  });

  it('makes centimetre ticks longest, then half centimetres, then millimetres', () => {
    const lengthOf = kind => ticks.find(t => t.kind === kind).lengthMm;
    expect(lengthOf('cm')).toBe(TICK_MM.cm);
    expect(lengthOf('half')).toBe(TICK_MM.half);
    expect(lengthOf('mm')).toBe(TICK_MM.mm);
    expect(TICK_MM.cm).toBeGreaterThan(TICK_MM.half);
    expect(TICK_MM.half).toBeGreaterThan(TICK_MM.mm);
    expect(ticks.filter(t => t.kind === 'half')).toHaveLength(15); // 5, 15, ... 145
  });
});
