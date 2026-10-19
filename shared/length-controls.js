// Switches a page's length controls between inches and millimetres (the DOM side of shared/lengths.js).

import { unitsSetting } from './global-settings.js';
import { convertControlValue } from './lengths.js';
import { byId } from './page.js';

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
