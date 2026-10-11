// Screen calibration maths: how many CSS pixels make one real millimetre on this screen.
// No DOM access, so it can be tested, and so future on-screen tools can reuse it.
//
// Browsers define 1 CSS inch as 96 CSS pixels, but a real screen almost never matches, so a box
// styled "85.6mm" is rarely 85.6 mm wide. The user holds a real object of known size against the
// screen and resizes an on-screen box to match it; the box width then gives pixels per real mm.

// What the browser assumes: CSS pixels per mm if the screen followed the CSS definition exactly.
export const NOMINAL_PX_PER_MM = 96 / 25.4;

// Things the user can measure against. Lengths in mm. `heightMm` draws a box of the right shape.
export const REFERENCES = {
  card: { label: 'Credit or ID card (long edge)', mm: 85.6, heightMm: 53.98 }, // ISO/IEC 7810 ID-1
  a4: { label: 'A4 paper (short edge)', mm: 210 },
  letter: { label: 'US Letter paper (short edge)', mm: 215.9 }, // 8.5 in
  custom: { label: 'Something else I can measure', mm: null },
};

export const CUSTOM_MM_MIN = 10;
export const CUSTOM_MM_MAX = 400;

function positive(value, name) {
  if (!(value > 0) || !Number.isFinite(value)) throw new RangeError(`${name} must be a positive number`);
}

// Pixels per real millimetre, from the on-screen width that matches a real length.
export function pxPerMm(widthPx, referenceMm) {
  positive(widthPx, 'widthPx');
  positive(referenceMm, 'referenceMm');
  return widthPx / referenceMm;
}

// Width in CSS pixels of a `referenceMm` object if the screen followed the CSS definition.
export function nominalWidthPx(referenceMm) {
  positive(referenceMm, 'referenceMm');
  return referenceMm * NOMINAL_PX_PER_MM;
}

export function mmToPx(mm, pxPerMmValue) {
  return mm * pxPerMmValue;
}

export function pxToMm(px, pxPerMmValue) {
  positive(pxPerMmValue, 'pxPerMm');
  return px / pxPerMmValue;
}

// How much one pixel of adjustment changes the result, as a percentage of the matched width.
export function stepPrecisionPercent(widthPx) {
  positive(widthPx, 'widthPx');
  return 100 / widthPx;
}

// The browser zoom or display has changed since the calibration was made (device pixel ratio differs).
export function isStale(calibratedRatio, currentRatio) {
  return Math.abs(calibratedRatio - currentRatio) > 0.005;
}

// Plain-language numbers for a calibration.
export function describeCalibration(pxPerMmValue) {
  positive(pxPerMmValue, 'pxPerMm');
  const scale = pxPerMmValue / NOMINAL_PX_PER_MM; // above 1: CSS "mm" come out smaller than real mm
  const cssMmError = (1 - 1 / scale) * 100; // how far off a length styled in CSS mm is, in percent
  return {
    pxPerMm: pxPerMmValue,
    pxPerInch: pxPerMmValue * 25.4,
    hundredMmInPx: mmToPx(100, pxPerMmValue),
    // positive: CSS mm are drawn too small; negative: too large
    cssMmTooSmallPercent: cssMmError,
  };
}

// The reference length to use: a built-in one, or the user's number clamped to a sensible range.
export function referenceLength(key, customMm) {
  const reference = REFERENCES[key];
  if (!reference) throw new RangeError(`unknown reference "${key}"`);
  if (reference.mm !== null) return reference.mm;
  const blank = customMm === null || customMm === undefined || String(customMm).trim() === '';
  const value = Number(customMm);
  if (blank || !Number.isFinite(value)) return 100;
  return Math.min(CUSTOM_MM_MAX, Math.max(CUSTOM_MM_MIN, value));
}
