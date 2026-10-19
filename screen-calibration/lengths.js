// The calibration page's length control, for both units (see shared/lengths.js). The inch values are the ones
// in index.html, and a test checks they agree. It is a box the user types into, so it is `exact`.
export const LENGTH_CONTROLS = {
  'custom-length': {
    in: { min: 0.5, max: 16, step: 0.05, value: 4, digits: 2, exact: true },
    mm: { min: 10, max: 400, step: 0.5, value: 100, digits: 1, exact: true },
  },
};
