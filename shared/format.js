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

// What to tell the user about how a card or chart used a pool of letters when no letter should repeat.
// `positions` is how many letters were placed and `poolSize` how many different letters there are to choose from.
export function letterUseNote(positions, poolSize) {
  if (positions === poolSize) return `All ${poolSize} letters are used once each.`;
  if (positions < poolSize) {
    return `No letter repeats. ${positions} of the ${poolSize} letters are used, so ${poolSize - positions} do not appear.`;
  }
  // Every letter is used before any is used again, so each appears `base` times and `extra` of them once more
  const base = Math.floor(positions / poolSize);
  const extra = positions % poolSize;
  let spread;
  if (extra === 0) spread = `every letter appears ${base} times`;
  else if (base === 1) spread = `every letter appears and ${extra} ${extra === 1 ? 'letter appears' : 'letters appear'} twice`;
  else spread = `every letter appears ${base} or ${base + 1} times`;
  return `There are ${positions} places but only ${poolSize} different letters, so ${spread}. Use ${poolSize} places or fewer for no repeats.`;
}
