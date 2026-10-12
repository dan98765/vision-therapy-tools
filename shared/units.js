// Length units. The pages show inches; the layout maths and the CSS use millimetres (CSS `mm` is true size
// in print), so values are converted at the edge, where the controls and notes are.

export const MM_PER_INCH = 25.4;

export const inchesToMm = inches => inches * MM_PER_INCH;
export const mmToInches = mm => mm / MM_PER_INCH;
