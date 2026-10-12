// Connects a tool's controls to the saved settings (shared/settings.js): puts the saved values back when the
// page opens, saves them when a control changes, and can put the defaults back.

import { byId } from './page.js';
import { createStore, restoreValues } from './settings.js';

// What a control accepts, read from the page, so the HTML stays the one place that says (see validValue)
export function describeControl(el) {
  if (el.type === 'checkbox') return { id: el.id, kind: 'boolean' };
  if (el.tagName === 'SELECT') return { id: el.id, kind: 'choice', options: [...el.options].map(o => o.value) };
  return { id: el.id, kind: 'number', min: Number(el.min), max: Number(el.max) };
}

// The value to save: a boolean, a string, a number, or null for a number box that is empty
function readValue(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.tagName === 'SELECT') return el.value;
  return el.value.trim() === '' ? null : Number(el.value);
}

function applyValue(el, value) {
  if (el.type === 'checkbox') el.checked = value;
  else el.value = String(value);
}

// The control's own default, as written in the HTML
function applyDefault(el) {
  if (el.type === 'checkbox') {
    el.checked = el.defaultChecked;
  } else if (el.tagName === 'SELECT') {
    const chosen = [...el.options].find(o => o.defaultSelected) ?? el.options[0];
    el.value = chosen.value;
  } else {
    el.value = el.defaultValue;
  }
}

// `tool` names the saved entry, and `ids` are the controls to remember.
export function rememberControls(tool, ids) {
  const elements = ids.map(byId);
  const store = createStore(tool);
  let extra = {};

  const save = () => {
    const values = Object.fromEntries(elements.map(el => [el.id, readValue(el)]));
    store.write({ values, extra });
  };

  return {
    // Put the saved values back into the controls. Returns the saved `extra`, which the tool reads itself.
    restore() {
      const saved = store.read();
      extra = saved.extra;
      const valid = restoreValues(saved.values, elements.map(describeControl));
      for (const el of elements) {
        if (Object.hasOwn(valid, el.id)) applyValue(el, valid[el.id]);
      }
      return extra;
    },

    // Save whenever one of the controls changes
    watch() {
      for (const el of elements) {
        el.addEventListener('input', save);
        el.addEventListener('change', save);
      }
    },

    // Keep (or with null, forget) one extra thing next to the control values
    setExtra(name, value) {
      if (value === null) delete extra[name];
      else extra[name] = value;
      save();
    },

    // Forget everything saved and put every control back to its default
    reset() {
      store.clear();
      extra = {};
      for (const el of elements) applyDefault(el);
    },
  };
}
