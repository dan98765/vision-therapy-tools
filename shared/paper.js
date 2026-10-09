// Will something fit on a printed page? Shared by the exercises that print at true size.
// All lengths are in mm.

// Printable area of a Letter or A4 page with about 10 mm margins (the smaller of the two in each direction).
export const PRINTABLE_W_MM = 190;
export const PRINTABLE_H_MM = 250;

// 'portrait' if it fits an upright page, 'landscape' if it only fits a sideways page, otherwise 'none'.
export function pageFit(widthMm, heightMm) {
  if (widthMm <= PRINTABLE_W_MM && heightMm <= PRINTABLE_H_MM) return 'portrait';
  if (widthMm <= PRINTABLE_H_MM && heightMm <= PRINTABLE_W_MM) return 'landscape';
  return 'none';
}

// What to tell the user about how a widthMm x heightMm exercise will print: { text, warn }.
// `rowsStayWhole` is for exercises (like the Hart chart) that continue onto more pages row by row,
// so something that is only too tall is not a problem.
export function pageNote(widthMm, heightMm, { rowsStayWhole = false } = {}) {
  const fit = pageFit(widthMm, heightMm);
  if (fit === 'portrait') return { text: '', warn: false };
  if (fit === 'landscape') return { text: ' Print in landscape.', warn: false };
  if (rowsStayWhole && widthMm <= PRINTABLE_W_MM) {
    return { text: ' Taller than one page, so it continues onto more pages when printed.', warn: false };
  }
  return {
    text:
      ` Warning: this is larger than one Letter/A4 page (about ${PRINTABLE_W_MM} × ${PRINTABLE_H_MM} mm)` +
      ' and will be cut off or split when printed. Use a smaller size.',
    warn: true,
  };
}
