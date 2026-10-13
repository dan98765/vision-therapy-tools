import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REMEMBERED as CARD_CONTROLS } from '../macdonald-form-field-cards/remembered.js';
import { REMEMBERED as TEMPLATE_CONTROLS } from '../_template/remembered.js';
import { REMEMBERED as HART_CONTROLS } from '../hart-chart/remembered.js';
import { REMEMBERED as CALIBRATION_CONTROLS } from '../screen-calibration/remembered.js';
import {
  SETTINGS_VERSION,
  browserStorage,
  createStore,
  restoreValues,
  storageKey,
  validValue,
} from '../shared/settings.js';

// Something with the three methods of localStorage
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

const throwing = () => {
  throw new Error('storage is blocked');
};
const blockedStorage = { getItem: throwing, setItem: throwing, removeItem: throwing };

describe('validValue', () => {
  const slider = { id: 'rings', kind: 'number', min: 3, max: 7 };
  const select = { id: 'set', kind: 'choice', options: ['all', 'vowels'] };
  const checkbox = { id: 'dot', kind: 'boolean' };

  it('accepts a number inside the range, ends included', () => {
    for (const ok of [3, 5, 7, 4.5]) expect(validValue(slider, ok)).toBe(ok);
  });

  it('ignores a number outside the range, or something that is not a number', () => {
    for (const bad of [2, 8, -1, NaN, Infinity, '5', null, undefined, true, [5], {}]) {
      expect(validValue(slider, bad), String(bad)).toBeUndefined();
    }
  });

  it('accepts only an option the select still has', () => {
    expect(validValue(select, 'vowels')).toBe('vowels');
    for (const bad of ['consonants', '', 'ALL', 5, null, ['all']]) expect(validValue(select, bad), String(bad)).toBeUndefined();
  });

  it('accepts only a real boolean for a checkbox', () => {
    expect(validValue(checkbox, true)).toBe(true);
    expect(validValue(checkbox, false)).toBe(false);
    for (const bad of ['true', 1, 0, null, undefined]) expect(validValue(checkbox, bad), String(bad)).toBeUndefined();
  });

  it('ignores a control of a kind it does not know', () => {
    expect(validValue({ id: 'x', kind: 'mystery' }, 5)).toBeUndefined();
  });
});

describe('restoreValues', () => {
  const specs = [
    { id: 'rings', kind: 'number', min: 3, max: 7 },
    { id: 'set', kind: 'choice', options: ['all', 'vowels'] },
    { id: 'dot', kind: 'boolean' },
  ];

  it('returns the valid saved values and drops the rest', () => {
    expect(restoreValues({ rings: 6, set: 'vowels', dot: false }, specs)).toEqual({ rings: 6, set: 'vowels', dot: false });
    expect(restoreValues({ rings: 99, set: 'gone', dot: 'yes' }, specs)).toEqual({});
    expect(restoreValues({ rings: 4, set: 'gone' }, specs)).toEqual({ rings: 4 });
  });

  it('ignores saved values for controls the page no longer has', () => {
    expect(restoreValues({ rings: 4, removed: 1 }, specs)).toEqual({ rings: 4 });
  });

  it('copes with saved data that is not an object', () => {
    for (const bad of [null, undefined, 'text', 5, [1, 2], true]) expect(restoreValues(bad, specs)).toEqual({});
  });

  it('does not take values from the prototype', () => {
    expect(restoreValues(JSON.parse('{"__proto__": {"rings": 4}}'), specs)).toEqual({});
  });
});

describe('browserStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is the page\'s localStorage when there is one', () => {
    const storage = fakeStorage();
    vi.stubGlobal('window', { localStorage: storage });
    expect(browserStorage()).toBe(storage);
  });

  it('is null when the browser blocks storage, or has none', () => {
    vi.stubGlobal('window', { get localStorage() { throw new Error('blocked'); } });
    expect(browserStorage()).toBeNull();
    vi.stubGlobal('window', {});
    expect(browserStorage()).toBeNull();
  });
});

describe('createStore', () => {
  it('has one entry per tool, named for the tool', () => {
    expect(storageKey('hart-chart')).toBe('vision-therapy-tools:hart-chart');
    expect(storageKey('hart-chart')).not.toBe(storageKey('macdonald-form-field-cards'));
  });

  it('reads back what it wrote', () => {
    const storage = fakeStorage();
    const store = createStore('hart-chart', storage);
    expect(store.write({ values: { rows: 10, 'show-numbers': true }, extra: { note: 'kept' } })).toBe(true);
    expect(createStore('hart-chart', storage).read()).toEqual({
      values: { rows: 10, 'show-numbers': true },
      extra: { note: 'kept' },
    });
  });

  it('keeps each tool separate', () => {
    const storage = fakeStorage();
    createStore('a', storage).write({ values: { x: 1 } });
    expect(createStore('b', storage).read()).toEqual({ values: {}, extra: {} });
  });

  it('gives nothing when nothing was saved', () => {
    expect(createStore('new', fakeStorage()).read()).toEqual({ values: {}, extra: {} });
  });

  it('gives nothing for rubbish, for another version, and for the wrong shape', () => {
    const key = storageKey('t');
    for (const bad of ['not json{', '5', '[]', '"text"', 'null', JSON.stringify({ values: { a: 1 } }), JSON.stringify({ version: SETTINGS_VERSION + 1, values: { a: 1 } })]) {
      expect(createStore('t', fakeStorage({ [key]: bad })).read(), bad).toEqual({ values: {}, extra: {} });
    }
  });

  it('keeps what is good when only part of the saved entry has the wrong shape', () => {
    const key = storageKey('t');
    const saved = JSON.stringify({ version: SETTINGS_VERSION, values: 'oops', extra: { a: 1 } });
    expect(createStore('t', fakeStorage({ [key]: saved })).read()).toEqual({ values: {}, extra: { a: 1 } });
  });

  it('does not throw when storage is blocked, missing or full', () => {
    for (const storage of [blockedStorage, null]) {
      const store = createStore('t', storage);
      expect(store.read()).toEqual({ values: {}, extra: {} });
      expect(store.write({ values: { a: 1 } })).toBe(false);
      expect(() => store.clear()).not.toThrow();
    }
  });

  it('clears what it saved', () => {
    const storage = fakeStorage();
    const store = createStore('t', storage);
    store.write({ values: { a: 1 } });
    store.clear();
    expect(storage.data).toEqual({});
    expect(store.read()).toEqual({ values: {}, extra: {} });
  });
});

// The lists of remembered controls live beside each page's code, so check they name real controls
describe('the controls each page remembers', () => {
  const root = resolve(import.meta.dirname, '..');
  const pages = {
    'macdonald-form-field-cards': CARD_CONTROLS,
    'hart-chart': HART_CONTROLS,
    'screen-calibration': CALIBRATION_CONTROLS,
    _template: TEMPLATE_CONTROLS,
  };

  for (const [folder, ids] of Object.entries(pages)) {
    const html = readFileSync(join(root, folder, 'index.html'), 'utf8');

    it(`${folder}: every remembered id is an input or select on the page, listed once`, () => {
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(html, id).toMatch(new RegExp(`<(input|select)[^>]*\\sid="${id}"`));
      }
    });

    it(`${folder}: no remembered control is a button`, () => {
      for (const id of ids) {
        expect(html, id).not.toMatch(new RegExp(`<input[^>]*type="(button|submit|reset)"[^>]*id="${id}"`));
      }
    });
  }

  it('does not remember the moving ring, which depends on the card drawn', () => {
    expect(CARD_CONTROLS).not.toContain('moving-ring');
  });
});
