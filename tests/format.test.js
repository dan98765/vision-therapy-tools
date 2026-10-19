import { describe, expect, it } from 'vitest';
import { lengthLabel, letterUseNote, mmLabel, ringCountsNote, sizeSummary } from '../shared/format.js';
import { DEFAULT_UNITS, MM_PER_INCH, UNITS, fromDisplay, inchesToMm, mmToInches, toDisplay } from '../shared/units.js';

describe('sizeSummary', () => {
  it('shows inches and the print reminder', () => {
    expect(sizeSummary(139.7, 215.9, 'in')).toBe(
      '5.50 × 8.50 in. Print at 100% / "Actual size" to keep this size.',
    );
  });

  it('shows whole millimetres in metric', () => {
    expect(sizeSummary(139.7, 215.9, 'mm')).toBe(
      '140 × 216 mm. Print at 100% / "Actual size" to keep this size.',
    );
  });
});

describe('lengthLabel', () => {
  it('writes a value already in the units with the given decimals', () => {
    expect(lengthLabel('0.2', 'in', 2)).toBe('0.20 in');
    expect(lengthLabel(8.5, 'in', 1)).toBe('8.5 in');
    expect(lengthLabel(3.14159, 'in', 3)).toBe('3.142 in');
    expect(lengthLabel('5', 'mm', 1)).toBe('5.0 mm');
  });
});

describe('mmLabel', () => {
  it('shows a length given in millimetres in either unit', () => {
    expect(mmLabel(25.4, 'in')).toBe('1.00 in');
    expect(mmLabel(25.4, 'mm')).toBe('25 mm');
    expect(mmLabel(1.5, 'in', 'small')).toBe('0.059 in');
    expect(mmLabel(1.5, 'mm', 'small')).toBe('1.50 mm');
  });

  it('rounds the printable page area as the page-fit warning shows it', () => {
    expect(mmLabel(184, 'in', 'page')).toBe('7.2 in');
    expect(mmLabel(254, 'in', 'page')).toBe('10.0 in');
    expect(mmLabel(184, 'mm', 'page')).toBe('184 mm');
  });
});

describe('units', () => {
  it('has 25.4 mm to the inch and converts both ways', () => {
    expect(MM_PER_INCH).toBe(25.4);
    expect(inchesToMm(8.5)).toBeCloseTo(215.9, 10);
    expect(mmToInches(inchesToMm(0.08))).toBeCloseTo(0.08, 12);
  });

  it('offers inches and millimetres, starting with inches', () => {
    expect(UNITS).toEqual(['in', 'mm']);
    expect(DEFAULT_UNITS).toBe('in');
  });

  it('converts a length to the number to show and back, in either unit', () => {
    expect(toDisplay(25.4, 'in')).toBeCloseTo(1, 12);
    expect(toDisplay(25.4, 'mm')).toBe(25.4);
    for (const units of UNITS) expect(fromDisplay(toDisplay(123.4, units), units)).toBeCloseTo(123.4, 10);
  });
});

describe('letterUseNote', () => {
  it('says when every letter is used once', () => {
    expect(letterUseNote(26, 26)).toBe('All 26 letters are used once each.');
  });

  it('says how many letters are not shown when the card is smaller than the alphabet', () => {
    expect(letterUseNote(24, 26)).toBe('No letter repeats. 24 of the 26 letters are used, so 2 do not appear.');
  });

  it('says what repeats when the card is bigger than the alphabet', () => {
    expect(letterUseNote(30, 26)).toContain('every letter appears and 4 letters appear twice');
    expect(letterUseNote(27, 26)).toContain('1 letter appears twice');
    expect(letterUseNote(52, 26)).toContain('every letter appears 2 times');
    expect(letterUseNote(70, 26)).toContain('every letter appears 2 or 3 times');
    expect(letterUseNote(30, 5)).toContain('every letter appears 6 times');
    expect(letterUseNote(30, 26)).toContain('Use 26 places or fewer');
  });
});

describe('ringCountsNote', () => {
  it('lists the letters on each ring, innermost first', () => {
    expect(ringCountsNote([5, 5, 5, 5, 6], 5)).toBe('The rings hold 5, 5, 5, 5, 6 letters, innermost first.');
  });

  it('says when fewer rings are used than asked for', () => {
    expect(ringCountsNote([5], 3)).toContain('Only 1 of the 3 rings is used');
    expect(ringCountsNote([3, 3], 5)).toContain('Only 2 of the 5 rings are used');
    expect(ringCountsNote([3, 3, 3], 3)).not.toContain('Only');
  });
});
