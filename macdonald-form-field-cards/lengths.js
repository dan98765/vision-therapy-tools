// The card page's length controls, for both units (see shared/lengths.js). The inch values are the ones in
// index.html, and a test checks they agree.
export const LENGTH_CONTROLS = {
  'card-size': {
    in: { min: 4, max: 10, step: 0.1, value: 8.5, digits: 1 },
    mm: { min: 100, max: 250, step: 1, value: 216, digits: 0 },
  },
  'base-letter': {
    in: { min: 0.04, max: 0.24, step: 0.01, value: 0.08, digits: 2 },
    mm: { min: 1, max: 6, step: 0.5, value: 2, digits: 1 },
  },
};
