// Hart chart: reads the controls, draws the chart.

import { inchLabel, sizeSummary } from '../shared/format.js';
import { bindPrint, byId, setNote } from '../shared/page.js';
import { rememberControls } from '../shared/remember.js';
import { pageNote } from '../shared/paper.js';
import { inchesToMm } from '../shared/units.js';
import { LETTER_SETS, buildGrid, gridLayout } from './grid.js';
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

function cell(className, text) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  return el;
}

function render() {
  const rows = grid.length;
  const cols = grid[0].length;
  const numbers = els.showNumbers.checked;
  const colNumbers = els.showColumnNumbers.checked;
  const layout = gridLayout({
    rows,
    cols,
    heightMm: inchesToMm(parseFloat(els.height.value)),
    spacing: parseFloat(els.spacing.value),
    numbers,
    colNumbers,
  });

  const mm = value => value.toFixed(3) + 'mm';
  els.chart.style.fontSize = mm(layout.fontMm);
  els.chart.style.gridAutoRows = mm(layout.cellH);
  els.chart.style.gridTemplateColumns =
    (numbers ? mm(layout.numW) + ' ' : '') +
    `repeat(${cols}, ${mm(layout.cellW)})` +
    (numbers ? ' ' + mm(layout.numW) : '');

  els.chart.textContent = '';
  // A row of column numbers, with an empty corner on each side when row numbers are shown too
  const appendColumnNumbers = () => {
    if (numbers) els.chart.append(cell('cell row-num', ''));
    for (let c = 1; c <= cols; c++) els.chart.append(cell('cell row-num', c));
    if (numbers) els.chart.append(cell('cell row-num', ''));
  };

  if (colNumbers) appendColumnNumbers();
  grid.forEach((row, r) => {
    if (numbers) els.chart.append(cell('cell row-num', r + 1));
    for (const letter of row) els.chart.append(cell('cell', letter));
    if (numbers) els.chart.append(cell('cell row-num', r + 1));
  });
  if (colNumbers) appendColumnNumbers();

  const page = pageNote(layout.chartW, layout.chartH, { rowsStayWhole: true });
  setNote(
    els.note,
    sizeSummary(layout.chartW, layout.chartH) +
      page.text +
      (layout.tooSmall ? ' Warning: letters this small may be too small to read.' : ''),
    page.warn || layout.tooSmall,
  );
}

function generate() {
  grid = buildGrid(parseInt(els.rows.value), parseInt(els.cols.value), LETTER_SETS[els.letterSet.value]);
  render();
}

function syncDisplays() {
  els.rowsVal.textContent = els.rows.value;
  els.colsVal.textContent = els.cols.value;
  els.heightVal.textContent = inchLabel(els.height.value);
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

// Controls come back as the user last left them, and are saved on this device as they change
const remember = rememberControls('hart-chart', REMEMBERED);
remember.restore();
remember.watch();
els.btnResetSettings.addEventListener('click', () => {
  remember.reset();
  syncDisplays();
  generate();
});

syncDisplays();
generate();
