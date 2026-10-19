// Connects a tool's controls to the saved settings (shared/settings.js): puts the saved values back when the
// page opens, saves them when a control changes, and can put the defaults back.
//
// Length controls (see shared/lengths.js) show inches or millimetres, so they are saved in millimetres and
// converted back for whichever units are showing when the page opens.

import { unitsSetting } from './global-settings.js';
import { mmFromControlValue, restoredControlValue } from './lengths.js';
import { byId } from './page.js';
import { createStore, restoreValues } from './settings.js';

// What a control accepts, read from the page, so the HTML stays the one place that says (see validValue)
export function describeControl(el) {
  if (el.type === 'checkbox') return { id: el.id, kind: 'boolean' };
  if (el.tagName === 'SELECT') return { id: el.id, kind: 'choice', options: [...el.options].map(o => o.value) };
  return { id: el.id, kind: 'number', min: Number(el.min), max: Number(el.max) };
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

// `tool` names the saved entry, and `ids` are the controls to remember. `lengths` maps the ids that are
// lengths to their definitions for both units; their defaults and saved values depend on the units showing.
export function rememberControls(tool, ids, { lengths = {} } = {}) {
  const elements = ids.map(byId);
  const store = createStore(tool);
  let extra = {};

  // The value to save: a boolean, a string, a number, or null for a number box that is empty
  function readValue(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.tagName === 'SELECT') return el.value;
    if (el.value.trim() === '') return null;
    return lengths[el.id] ? mmFromControlValue(Number(el.value), unitsSetting.get()) : Number(el.value);
  }

  const save = () => {
    const values = Object.fromEntries(elements.map(el => [el.id, readValue(el)]));
    store.write({ values, extra });
  };

  return {
    // Put the saved values back into the controls. Returns the saved `extra`, which the tool reads itself.
    restore() {
      const saved = store.read();
      extra = saved.extra;
      const plain = elements.filter(el => !lengths[el.id]);
      const valid = restoreValues(saved.values, plain.map(describeControl));
      for (const el of plain) {
        if (Object.hasOwn(valid, el.id)) applyValue(el, valid[el.id]);
      }
      for (const el of elements.filter(el => lengths[el.id])) {
        const value = restoredControlValue(saved.values[el.id], unitsSetting.get(), lengths[el.id]);
        if (value !== undefined) applyValue(el, value);
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

    // Save now, for a change made by the page rather than by the user (such as switching units)
    save,

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
      for (const el of elements) {
        if (lengths[el.id]) el.value = String(lengths[el.id][unitsSetting.get()].value);
        else applyDefault(el);
      }
    },
  };
}
