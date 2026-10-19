// Remembering what the user last set each tool's controls to, in the browser's own storage on their device.
// Nothing here touches the page, so it can be tested. shared/remember.js connects it to the controls.
//
// Saved values are untrusted: the page may have changed since they were saved (a slider's range, an option
// that no longer exists), or someone may have edited the storage. A value is used only if it is still valid
// for its control, and is otherwise ignored, so the control keeps its default.

// Change this when the saved shape changes, to discard what older versions saved.
// 2: length controls are saved in millimetres (they were saved as the inches shown).
export const SETTINGS_VERSION = 2;

const KEY_PREFIX = 'vision-therapy-tools';

export const storageKey = tool => `${KEY_PREFIX}:${tool}`;

// ── Values ───────────────────────────────────────────────

// What a control accepts. `describeControl` in remember.js builds these from the page, so the page stays the
// single source of the ranges and options:
//   { id, kind: 'number', min, max }   a slider or number box
//   { id, kind: 'choice', options }    a select, `options` being the option values
//   { id, kind: 'boolean' }            a checkbox
// A value is returned as it should be applied, or undefined when it is not valid for the control.
export function validValue(spec, value) {
  switch (spec.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) && value >= spec.min && value <= spec.max
        ? value
        : undefined;
    case 'choice':
      return typeof value === 'string' && spec.options.includes(value) ? value : undefined;
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined;
    default:
      return undefined;
  }
}

// The saved values that are still valid for the page's controls, as { id: value }. Anything else is dropped.
export function restoreValues(saved, specs) {
  const restored = {};
  if (!isPlainObject(saved)) return restored;
  for (const spec of specs) {
    if (!Object.hasOwn(saved, spec.id)) continue;
    const value = validValue(spec, saved[spec.id]);
    if (value !== undefined) restored[spec.id] = value;
  }
  return restored;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ── Storage ──────────────────────────────────────────────

// The browser's localStorage, or null where it is blocked (some private windows, site data turned off)
export function browserStorage() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

// A store for one tool. `storage` is anything with getItem, setItem and removeItem, so tests can use a
// fake. Every method copes with storage that is missing, full, blocked or holding rubbish: reading then
// gives nothing, and writing quietly does nothing, so the page works with its defaults.
// What is kept is { version, values, extra }: the control values, and anything else the tool wants kept
// (the calibration page keeps its calibration in `extra`).
export function createStore(tool, storage = browserStorage()) {
  const key = storageKey(tool);
  return {
    read() {
      const empty = { values: {}, extra: {} };
      try {
        const saved = JSON.parse(storage?.getItem(key) ?? 'null');
        if (!isPlainObject(saved) || saved.version !== SETTINGS_VERSION) return empty;
        return {
          values: isPlainObject(saved.values) ? saved.values : {},
          extra: isPlainObject(saved.extra) ? saved.extra : {},
        };
      } catch {
        return empty;
      }
    },

    // Returns whether it was saved
    write({ values = {}, extra = {} }) {
      try {
        if (!storage) return false;
        storage.setItem(key, JSON.stringify({ version: SETTINGS_VERSION, values, extra }));
        return true;
      } catch {
        return false;
      }
    },

    clear() {
      try {
        storage?.removeItem(key);
      } catch {
        // nothing to clear
      }
    },
  };
}
