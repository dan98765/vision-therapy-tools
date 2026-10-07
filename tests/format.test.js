import { describe, expect, it } from 'vitest';
import { mmLabel, sizeSummary } from '../shared/format.js';

describe('sizeSummary', () => {
  it('shows mm and inches and the print reminder', () => {
    expect(sizeSummary(139.7, 215.9)).toBe(
      '140 × 216 mm (5.5 × 8.5 in). Print at 100% / "Actual size" to keep this size.',
    );
  });
});

describe('mmLabel', () => {
  it('formats with one decimal by default', () => {
    expect(mmLabel('2')).toBe('2.0 mm');
    expect(mmLabel(3.14159, 2)).toBe('3.14 mm');
  });
});
