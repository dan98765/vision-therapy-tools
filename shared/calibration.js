// Screen calibration maths: how many CSS pixels make one real millimetre on this screen.
// No DOM access, so it can be tested, and so future on-screen tools can reuse it.
//
// Browsers define 1 CSS inch as 96 CSS pixels, but a real screen almost never matches, so a box
// styled "85.6mm" is rarely 85.6 mm wide. The user holds a real object of known size against the
// screen and resizes an on-screen box to match it; the box width then gives pixels per real mm.

// What the browser assumes: CSS pixels per mm if the screen followed the CSS definition exactly.
export const NOMINAL_PX_PER_MM = 96 / 25.4;

// Things the user can measure against. Lengths in mm; `heightMm` lets the box be drawn the right shape.
// The wording shown to the user is in screen-calibration/index.html, and a test keeps the two in step.
export const REFERENCES = {
  card: { mm: 85.6, heightMm: 53.98 }, // credit or ID card, long edge (ISO/IEC 7810 ID-1)
  a4: { mm: 210 }, // short edge
  letter: { mm: 215.9 }, // short edge, 8.5 in
  custom: { mm: null }, // the user's own length
};

export const CUSTOM_MM_MIN = 10;
export const CUSTOM_MM_MAX = 400;
export const CUSTOM_MM_DEFAULT = 100;

// The box slider spans this share of the width the browser would assume, which any real screen falls inside.
export const BOX_RANGE = { min: 0.5, max: 2 };

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

// The widths the box slider can take for a reference, in whole pixels.
export function boxWidthRange(referenceMm) {
  const nominal = nominalWidthPx(referenceMm);
  return { min: Math.floor(nominal * BOX_RANGE.min), max: Math.ceil(nominal * BOX_RANGE.max) };
}

export function clampWidth(widthPx, range) {
  return Math.min(range.max, Math.max(range.min, widthPx));
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

// Where the calibration stands: 'unadjusted' (still the browser's assumption), 'calibrated', or 'stale'
// (adjusted, but the zoom or display has changed since).
export function calibrationStatus({ adjusted, calibratedRatio, currentRatio }) {
  if (!adjusted) return 'unadjusted';
  return isStale(calibratedRatio, currentRatio) ? 'stale' : 'calibrated';
}

// Plain-language numbers for a calibration.
export function describeCalibration(pxPerMmValue) {
  positive(pxPerMmValue, 'pxPerMm');
  const scale = pxPerMmValue / NOMINAL_PX_PER_MM; // above 1: CSS "mm" come out smaller than real mm
  return {
    pxPerMm: pxPerMmValue,
    pxPerInch: pxPerMmValue * 25.4,
    hundredMmInPx: mmToPx(100, pxPerMmValue),
    // How far a length styled in CSS mm is from the real length, in percent.
    // Positive: CSS mm are drawn too small; negative: too large.
    cssMmTooSmallPercent: (1 - 1 / scale) * 100,
  };
}

// The reference length to use: a built-in one, or the user's number kept within the allowed range.
// A blank or non-numeric custom length gives the default.
export function referenceLength(key, customMm) {
  const reference = REFERENCES[key];
  if (!reference) throw new RangeError(`unknown reference "${key}"`);
  if (reference.mm !== null) return reference.mm;
  const blank = customMm === null || customMm === undefined || String(customMm).trim() === '';
  const value = Number(customMm);
  if (blank || !Number.isFinite(value)) return CUSTOM_MM_DEFAULT;
  return Math.min(CUSTOM_MM_MAX, Math.max(CUSTOM_MM_MIN, value));
}
