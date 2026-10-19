// The Units control in the header bar: shows the units in use and changes them for every page.

import { unitsSetting } from './global-settings.js';

const select = document.getElementById('units');
if (select) {
  select.value = unitsSetting.get();
  select.addEventListener('change', () => unitsSetting.set(select.value));
  unitsSetting.onChange(units => {
    select.value = units;
  });
}
