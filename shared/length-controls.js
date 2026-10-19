// Switches a page's length controls between inches and millimetres (the DOM side of shared/lengths.js).

import { unitsSetting } from './global-settings.js';
import { controlValueFromMm, convertControlValue } from './lengths.js';
import { byId } from './page.js';
import { parseLetterMm, prefillMessage } from './prefill.js';

// Give each control the range, step and (when first set up) default of `units`. When `previousUnits` is given
// the control keeps what it was showing, converted and snapped to the new step.
function applyUnits(lengths, units, previousUnits) {
  for (const [id, spec] of Object.entries(lengths)) {
    const el = byId(id);
    const { min, max, step, value } = spec[units];
    const shown = previousUnits === null ? value : convertControlValue(Number(el.value), previousUnits, units, spec);
    el.min = String(min);
    el.max = String(max);
    el.step = String(step);
    el.value = String(shown);
  }
}

// If the page was opened from a link carrying a letter height (see shared/prefill.js), put it in `control` (a
// length control with definition `spec`), say so in `note`, and take it out of the address so a reload does not
// put it back over later changes. Returns whether it did. A height
// the control cannot show is moved to the nearest it can, and the note says so. Call it after restoring saved
// settings, so the link wins, and save afterwards.
export function applyLetterPrefill({ control, spec, note }) {
  const mm = parseLetterMm(window.location.search);
  if (mm === null) return false;
  const units = unitsSetting.get();
  const value = controlValueFromMm(mm, units, spec);
  control.value = String(value);
  note.textContent = prefillMessage(mm, value, units, spec[units]);
  note.hidden = false;
  window.history.replaceState(null, '', window.location.pathname);
  return true;
}

// Set up a page's length controls for the units showing now, and keep them in step when the user switches.
// Call it before restoring saved settings, because the saved values are converted for these controls.
// `onChange(units)` is for the page to redraw its readouts and notes. Returns `{ units }`, the current units.
export function useUnits(lengths, onChange) {
  let shown = unitsSetting.get();
  applyUnits(lengths, shown, null);
  unitsSetting.onChange(units => {
    applyUnits(lengths, units, shown);
    shown = units;
    onChange(units);
  });
  return { units: () => unitsSetting.get() };
}
