import { describe, expect, it } from 'vitest';
import { inchLabel, mmAsInches, sizeSummary } from '../shared/format.js';
import { MM_PER_INCH, inchesToMm, mmToInches } from '../shared/units.js';

describe('sizeSummary', () => {
  it('shows inches and the print reminder', () => {
    expect(sizeSummary(139.7, 215.9)).toBe(
      '5.50 × 8.50 in. Print at 100% / "Actual size" to keep this size.',
    );
  });
});

describe('inchLabel', () => {
  it('formats with two decimals by default', () => {
    expect(inchLabel('0.2')).toBe('0.20 in');
    expect(inchLabel(8.5, 1)).toBe('8.5 in');
    expect(inchLabel(3.14159, 3)).toBe('3.142 in');
  });
});

describe('mmAsInches', () => {
  it('shows a length given in millimetres as inches', () => {
    expect(mmAsInches(25.4)).toBe('1.00 in');
    expect(mmAsInches(1.5, 3)).toBe('0.059 in');
  });
});

describe('units', () => {
  it('has 25.4 mm to the inch and converts both ways', () => {
    expect(MM_PER_INCH).toBe(25.4);
    expect(inchesToMm(8.5)).toBeCloseTo(215.9, 10);
    expect(mmToInches(inchesToMm(0.08))).toBeCloseTo(0.08, 12);
  });
});
