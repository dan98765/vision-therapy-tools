// The calculator's length controls, for both units (see shared/lengths.js). The inch values are the ones in
// index.html, and a test checks they agree. Both are boxes the user types into, so both are `exact`, and the
// defaults describe a letter of about 30 minutes of arc at 16 in (40 cm).
export const LENGTH_CONTROLS = {
  'letter-height': {
    in: { min: 0.01, max: 24, step: 0.01, value: 0.14, digits: 3, exact: true },
    mm: { min: 0.25, max: 600, step: 0.25, value: 3.5, digits: 2, exact: true },
  },
  'viewing-distance': {
    in: { min: 4, max: 600, step: 1, value: 16, digits: 1, exact: true },
    mm: { min: 100, max: 15000, step: 10, value: 400, digits: 0, exact: true },
  },
};
