// Text shown to the user, kept pure so it can be tested. Lengths are shown in the user's units, inches or
// millimetres (see shared/units.js); `units` below is 'in' or 'mm'.

import { toDisplay } from './units.js';

// Decimals to show: a page size is a rounder number than the height of a small letter
const DIGITS = { in: { size: 2, small: 3, page: 1 }, mm: { size: 0, small: 2, page: 0 } };

// A length shown in the control's units, such as "0.20 in" or "5.0 mm". `value` is already in `units`.
export function lengthLabel(value, units, digits) {
  return `${Number(value).toFixed(digits)} ${units}`;
}

// A length given in millimetres, shown in `units`. `kind` is 'size' (a card or chart), 'small' (a letter) or 'page' (the printable area of a sheet).
export function mmLabel(mm, units, kind = 'size') {
  return lengthLabel(toDisplay(mm, units), units, DIGITS[units][kind]);
}

export function sizeSummary(widthMm, heightMm, units) {
  const digits = DIGITS[units].size;
  const size = [widthMm, heightMm].map(mm => toDisplay(mm, units).toFixed(digits)).join(' × ');
  return `${size} ${units}. Print at 100% / "Actual size" to keep this size.`;
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

// How the letters were spread over the rings when every letter is used once. `counts` is the number of
// letters on each ring, innermost first; `askedFor` is the number of rings the user chose.
export function ringCountsNote(counts, askedFor) {
  const fewer = counts.length < askedFor
    ? ` Only ${counts.length} of the ${askedFor} rings ${counts.length === 1 ? 'is' : 'are'} used, because every ring needs at least 3 letters.`
    : '';
  return `The rings hold ${counts.join(', ')} letters, innermost first.${fewer}`;
}
