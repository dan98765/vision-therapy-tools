// Hart chart: reads the controls, draws the chart.

import { lengthLabel } from '../shared/format.js';
import { LETTER_SETS, buildGrid, chartNote, gridLayout } from '../shared/hart-grid.js';
import { drawChart } from '../shared/hart-draw.js';
import { applyLetterPrefill, useUnits } from '../shared/length-controls.js';
import { bindPrint, byId, setNote } from '../shared/page.js';
import { rememberControls } from '../shared/remember.js';
import { fromDisplay } from '../shared/units.js';
import { LENGTH_CONTROLS } from './lengths.js';
import { REMEMBERED } from './remembered.js';

const els = {
  chart: byId('chart'),
  rows: byId('rows'),
  rowsVal: byId('rows-val'),
  cols: byId('cols'),
  colsVal: byId('cols-val'),
  height: byId('letter-height'),
  heightVal: byId('letter-height-val'),
  spacing: byId('spacing'),
  spacingVal: byId('spacing-val'),
  letterSet: byId('letter-set'),
  showNumbers: byId('show-numbers'),
  showColumnNumbers: byId('show-column-numbers'),
  btnGenerate: byId('btn-generate'),
  btnPrint: byId('btn-print'),
  btnResetSettings: byId('btn-reset-settings'),
  note: byId('chart-note'),
};

// The current letters, kept so size and spacing changes do not reshuffle them
let grid = [];

function render() {
  const rows = grid.length;
  const cols = grid[0].length;
  const numbers = els.showNumbers.checked;
  const colNumbers = els.showColumnNumbers.checked;
  const layout = gridLayout({
    rows,
    cols,
    heightMm: fromDisplay(parseFloat(els.height.value), view.units()),
    spacing: parseFloat(els.spacing.value),
    numbers,
    colNumbers,
  });

  drawChart(els.chart, grid, layout, { numbers, colNumbers });

  const { text, warn } = chartNote(layout, view.units());
  setNote(els.note, text, warn);
}

function generate() {
  grid = buildGrid(parseInt(els.rows.value), parseInt(els.cols.value), LETTER_SETS[els.letterSet.value]);
  render();
}

function syncDisplays() {
  els.rowsVal.textContent = els.rows.value;
  els.colsVal.textContent = els.cols.value;
  const units = view.units();
  els.heightVal.textContent = lengthLabel(els.height.value, units, LENGTH_CONTROLS['letter-height'][units].digits);
  els.spacingVal.textContent = parseFloat(els.spacing.value).toFixed(1) + '×';
}

// Size and spacing redraw the same letters; the rest need a new chart.
for (const input of [els.height, els.spacing, els.showNumbers, els.showColumnNumbers]) {
  input.addEventListener('input', () => { syncDisplays(); render(); });
}
for (const input of [els.rows, els.cols, els.letterSet]) {
  input.addEventListener('input', () => { syncDisplays(); generate(); });
}
els.btnGenerate.addEventListener('click', generate);
bindPrint(els.btnPrint);

// The length control shows the units chosen in the header. Set it up before restoring saved settings.
const view = useUnits(LENGTH_CONTROLS, () => {
  remember.save();
  syncDisplays();
  render();
});

// Controls come back as the user last left them, and are saved on this device as they change
const remember = rememberControls('hart-chart', REMEMBERED, { lengths: LENGTH_CONTROLS });
remember.restore();
const prefill = { control: els.height, spec: LENGTH_CONTROLS['letter-height'], note: byId('prefill-note') };
if (applyLetterPrefill(prefill)) remember.save();
remember.watch();
els.btnResetSettings.addEventListener('click', () => {
  remember.reset();
  syncDisplays();
  generate();
});

syncDisplays();
generate();
