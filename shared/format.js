// Text shown to the user, kept pure so it can be tested. Lengths are shown in inches.

import { mmToInches } from './units.js';

// A length in inches, such as "0.20 in".
export function inchLabel(inches, digits = 2) {
  return `${Number(inches).toFixed(digits)} in`;
}

// A length given in millimetres, shown in inches.
export function mmAsInches(mm, digits = 2) {
  return inchLabel(mmToInches(mm), digits);
}

export function sizeSummary(widthMm, heightMm) {
  return `${mmToInches(widthMm).toFixed(2)} × ${mmToInches(heightMm).toFixed(2)} in. ` +
    'Print at 100% / "Actual size" to keep this size.';
}
