// Settings that belong to the user, not to one tool, and apply to every page. Today that is the units (inches
// or millimetres). Kept on the device like each tool's settings (shared/settings.js), under its own entry, so
// every page and every later visit sees the same choice.

import { DEFAULT_UNITS, UNITS } from './units.js';
import { createStore, validValue } from './settings.js';

const UNITS_SPEC = { id: 'units', kind: 'choice', options: UNITS };

// The units setting kept in `store` (see createStore). `get` is the current units, `set` changes them and
// tells every listener, and `onChange` registers one. A saved value that is not one of the units is ignored.
export function createUnitsSetting(store) {
  let units = validValue(UNITS_SPEC, store.read().values.units) ?? DEFAULT_UNITS;
  const listeners = new Set();

  return {
    get: () => units,

    set(next) {
      if (!UNITS.includes(next) || next === units) return;
      units = next;
      store.write({ values: { units } });
      for (const listener of listeners) listener(units);
    },

    // Returns a function that stops listening
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// The one the pages share
export const unitsSetting = createUnitsSetting(createStore('global'));
