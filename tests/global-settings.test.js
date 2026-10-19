import { describe, expect, it } from 'vitest';
import { createUnitsSetting } from '../shared/global-settings.js';
import { SETTINGS_VERSION, createStore, storageKey } from '../shared/settings.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

const saved = units => JSON.stringify({ version: SETTINGS_VERSION, values: { units }, extra: {} });

describe('the units setting', () => {
  it('starts in inches when nothing was saved', () => {
    expect(createUnitsSetting(createStore('global', fakeStorage())).get()).toBe('in');
  });

  it('starts with the units saved on an earlier visit', () => {
    const storage = fakeStorage({ [storageKey('global')]: saved('mm') });
    expect(createUnitsSetting(createStore('global', storage)).get()).toBe('mm');
  });

  it('ignores a saved value that is not one of the units', () => {
    for (const bad of ['cm', '', 5, null, ['mm'], 'MM']) {
      const storage = fakeStorage({ [storageKey('global')]: saved(bad) });
      expect(createUnitsSetting(createStore('global', storage)).get(), String(bad)).toBe('in');
    }
  });

  it('ignores saved data from another version or that is not valid', () => {
    for (const bad of ['{nope', JSON.stringify({ version: 1, values: { units: 'mm' } }), 'null']) {
      const storage = fakeStorage({ [storageKey('global')]: bad });
      expect(createUnitsSetting(createStore('global', storage)).get(), bad).toBe('in');
    }
  });

  it('changes the units, saves them, and tells everyone listening', () => {
    const storage = fakeStorage();
    const setting = createUnitsSetting(createStore('global', storage));
    const heard = [];
    setting.onChange(units => heard.push(units));
    setting.set('mm');
    expect(setting.get()).toBe('mm');
    expect(heard).toEqual(['mm']);
    expect(createUnitsSetting(createStore('global', storage)).get()).toBe('mm'); // a later visit
    setting.set('in');
    expect(heard).toEqual(['mm', 'in']);
  });

  it('says nothing when the units are set to what they already are, or to something that is not a unit', () => {
    const setting = createUnitsSetting(createStore('global', fakeStorage()));
    const heard = [];
    setting.onChange(units => heard.push(units));
    setting.set('in');
    setting.set('cm');
    setting.set(undefined);
    expect(heard).toEqual([]);
    expect(setting.get()).toBe('in');
  });

  it('lets a listener stop listening', () => {
    const setting = createUnitsSetting(createStore('global', fakeStorage()));
    const heard = [];
    const stop = setting.onChange(units => heard.push(units));
    setting.set('mm');
    stop();
    setting.set('in');
    expect(heard).toEqual(['mm']);
  });

  it('still works when storage is blocked: the choice lasts until the page closes', () => {
    const setting = createUnitsSetting(createStore('global', null));
    expect(setting.get()).toBe('in');
    setting.set('mm');
    expect(setting.get()).toBe('mm');
  });

  it('keeps its choice apart from every tool\'s own settings', () => {
    expect(storageKey('global')).not.toBe(storageKey('hart-chart'));
  });
});
