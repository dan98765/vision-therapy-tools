// Text shown to the user, kept pure so it can be tested.

const inches = mm => (mm / 25.4).toFixed(1);

export function sizeSummary(widthMm, heightMm) {
  return `${widthMm.toFixed(0)} × ${heightMm.toFixed(0)} mm (${inches(widthMm)} × ${inches(heightMm)} in). ` +
    'Print at 100% / "Actual size" to keep this size.';
}

export function mmLabel(value, digits = 1) {
  return `${Number(value).toFixed(digits)} mm`;
}
