// The Hart chart's length controls, for both units (see shared/lengths.js). The inch values are the ones in
// index.html, and a test checks they agree.
export const LENGTH_CONTROLS = {
  'letter-height': {
    in: { min: 0.08, max: 1.2, step: 0.02, value: 0.2, digits: 2 },
    mm: { min: 2, max: 30, step: 0.5, value: 5, digits: 1 },
  },
};
