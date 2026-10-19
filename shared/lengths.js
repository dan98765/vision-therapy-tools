// Length controls (sliders and number boxes) that show inches or millimetres. No DOM access, so it can be tested.
//
// Each length control has a definition for both systems, so every step is a tidy number in either one:
//   { in: { min, max, step, value, digits }, mm: { min, max, step, value, digits } }
// `value` is the default and `digits` the decimals to show. Values are converted through millimetres.
// A slider's value is moved onto its step grid. A box the user types a number into sets `exact: true`, and keeps
// what was typed (rounded to `digits`), so a length such as 120 mm is not nudged to the nearest step.

import { fromDisplay, toDisplay } from './units.js';

// How many decimals a number is written with, for rounding away float noise (0.1 + 0.2)
function decimalsOf(number) {
  const text = String(number);
  return text.includes('.') ? text.split('.')[1].length : 0;
}

// `value` moved onto the control's step grid (counted from its minimum) and kept inside its range.
export function snapToControl(value, { min, max, step }) {
  const onGrid = min + Math.round((value - min) / step) * step;
  const clamped = Math.min(max, Math.max(min, onGrid));
  return Number(clamped.toFixed(Math.max(decimalsOf(step), decimalsOf(min), decimalsOf(max))));
}

// `value` as the control should hold it: kept inside the range, and either moved onto the step grid (a
// slider) or rounded to its `digits` (an exact box).
export function fitToControl(value, unitSpec) {
  if (!unitSpec.exact) return snapToControl(value, unitSpec);
  const clamped = Math.min(unitSpec.max, Math.max(unitSpec.min, value));
  return Number(clamped.toFixed(unitSpec.digits));
}

// A length in millimetres as the value to put in the control when it shows `units`: converted and fitted.
export function controlValueFromMm(mm, units, spec) {
  return fitToControl(toDisplay(mm, units), spec[units]);
}

// A displayed value after the user switches from one system to the other.
export function convertControlValue(value, fromUnits, toUnits, spec) {
  return controlValueFromMm(fromDisplay(value, fromUnits), toUnits, spec);
}

// A length saved in millimetres, as the value to restore into a control showing `units`. Saved data is not
// trusted: it must be a positive number, and must land inside the control's range (within half a step, for
// rounding), or it is ignored (undefined) and the control keeps its default.
export function restoredControlValue(savedMm, units, spec) {
  if (typeof savedMm !== 'number' || !Number.isFinite(savedMm) || savedMm <= 0) return undefined;
  const { min, max, step } = spec[units];
  const shown = toDisplay(savedMm, units);
  if (shown < min - step / 2 || shown > max + step / 2) return undefined;
  return fitToControl(shown, spec[units]);
}

// What to save for a control showing `value`: its length in millimetres, rounded so float noise is not kept.
export function mmFromControlValue(value, units) {
  return Number(fromDisplay(value, units).toFixed(3));
}
