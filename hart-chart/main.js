// Hart chart: reads the controls, draws the chart.

import { mmLabel, sizeSummary } from '../shared/format.js';
import { bindPrint, byId, setNote } from '../shared/page.js';
import { pageNote } from '../shared/paper.js';
import { LETTER_SETS, buildGrid, gridLayout } from './grid.js';

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
  btnGenerate: byId('btn-generate'),
  btnPrint: byId('btn-print'),
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
  const layout = gridLayout({
    rows,
    cols,
    heightMm: parseFloat(els.height.value),
    spacing: parseFloat(els.spacing.value),
    numbers,
  });

  const mm = value => value.toFixed(3) + 'mm';
  els.chart.style.fontSize = mm(layout.fontMm);
  els.chart.style.gridAutoRows = mm(layout.cellH);
  els.chart.style.gridTemplateColumns =
    (numbers ? mm(layout.numW) + ' ' : '') +
    `repeat(${cols}, ${mm(layout.cellW)})` +
    (numbers ? ' ' + mm(layout.numW) : '');

  els.chart.textContent = '';
  grid.forEach((row, r) => {
    if (numbers) els.chart.append(cell('cell row-num', r + 1));
    for (const letter of row) els.chart.append(cell('cell', letter));
    if (numbers) els.chart.append(cell('cell row-num', r + 1));
  });

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
  els.heightVal.textContent = mmLabel(els.height.value);
  els.spacingVal.textContent = parseFloat(els.spacing.value).toFixed(1) + '×';
}

// Size and spacing redraw the same letters; the rest need a new chart.
for (const input of [els.height, els.spacing, els.showNumbers]) {
  input.addEventListener('input', () => { syncDisplays(); render(); });
}
for (const input of [els.rows, els.cols, els.letterSet]) {
  input.addEventListener('input', () => { syncDisplays(); generate(); });
}
els.btnGenerate.addEventListener('click', generate);
bindPrint(els.btnPrint);

syncDisplays();
generate();
