// The matched pair's length control, for both units (see shared/lengths.js). The inch values are the ones in
// index.html, and a test checks they agree. The large chart's letter height is this times the size ratio.
export const LENGTH_CONTROLS = {
  'small-height': {
    in: { min: 0.08, max: 0.5, step: 0.02, value: 0.16, digits: 2 },
    mm: { min: 2, max: 12, step: 0.5, value: 4, digits: 1 },
  },
};
