// A letter height carried in a link, from the letter-size calculator to the chart and card pages. Only a length
// travels, in millimetres whatever units are showing (?letter-mm=6.35), and nothing about the person. No DOM
// access, so it can be tested. Whatever is in a link is untrusted, so it is parsed strictly.

import { toDisplay } from './units.js';
import { lengthLabel, mmLabel } from './format.js';

export const PREFILL_PARAM = 'letter-mm';

// The pages that take a letter height from a link (the calculator links to each of them). A test checks each
// one really does, and has somewhere to say so.
export const PREFILL_PAGES = ['hart-chart', 'matched-hart-pair', 'macdonald-form-field-cards'];

// The longest letter a link may ask for, in mm: far beyond any slider
const MAX_PREFILL_MM = 1000;

// The link for `path` (a folder such as '../hart-chart/') asking for a letter `mm` tall.
export function letterLink(path, mm) {
  return `${path}?${PREFILL_PARAM}=${Number(mm).toFixed(3)}`;
}

// The letter height in a page's query string (`search`, such as "?letter-mm=6.35"), or null if there is none
// or it is not a plain positive number. Only the first value counts, and forms such as "1e2" or "0x10" are
// refused, so a link can only say a length written the way the calculator writes one.
export function parseLetterMm(search) {
  const value = new URLSearchParams(search).get(PREFILL_PARAM);
  if (value === null || !/^\d{1,4}(\.\d{1,6})?$/.test(value)) return null;
  const mm = Number(value);
  return mm > 0 && mm <= MAX_PREFILL_MM ? mm : null;
}

// What to tell the user once the control has been set: `value` is what the control now shows, in `units`, and
// `unitSpec` its range for those units.
export function prefillMessage(mm, value, units, unitSpec) {
  const shown = lengthLabel(value, units, unitSpec.digits);
  const requested = toDisplay(mm, units);
  const outside = requested < unitSpec.min - 1e-9 || requested > unitSpec.max + 1e-9;
  if (!outside) return `Letter height set to ${shown}, from the letter size calculator.`;
  return (
    `The letter size calculator asked for ${mmLabel(mm, units, 'small')}, which is outside the range this page ` +
    `can make, so it is set to the nearest it can do, ${shown}.`
  );
}
