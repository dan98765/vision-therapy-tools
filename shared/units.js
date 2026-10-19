// Length units. The pages can show inches or millimetres (the global Units setting); the layout maths and the
// CSS always use millimetres (CSS `mm` is true size in print), so values are converted at the edge, where the
// controls and notes are.

export const MM_PER_INCH = 25.4;

// The systems the user can choose between, and the one used until they choose
export const UNITS = ['in', 'mm'];
export const DEFAULT_UNITS = 'in';

// The words for each system, for labels and messages
export const UNIT_WORDS = {
  in: { plural: 'inches', singular: 'inch' },
  mm: { plural: 'millimetres', singular: 'millimetre' },
};

export const inchesToMm = inches => inches * MM_PER_INCH;
export const mmToInches = mm => mm / MM_PER_INCH;

// A length in millimetres as the number to show, and back
export const toDisplay = (mm, units) => (units === 'mm' ? mm : mmToInches(mm));
export const fromDisplay = (value, units) => (units === 'mm' ? value : inchesToMm(value));
