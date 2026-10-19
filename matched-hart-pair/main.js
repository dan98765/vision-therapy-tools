// Matched Hart pair: reads the controls, draws a small chart and a large chart with the same letters.

import { lengthLabel, sizeSummary } from '../shared/format.js';
import { drawChart } from '../shared/hart-draw.js';
import { LETTER_SETS, buildGrid } from '../shared/hart-grid.js';
import { useUnits } from '../shared/length-controls.js';
import { byId, setNote } from '../shared/page.js';
import { rememberControls } from '../shared/remember.js';
import { pageNote } from '../shared/paper.js';
import { fromDisplay, toDisplay } from '../shared/units.js';
import { LENGTH_CONTROLS } from './lengths.js';
import { largeHeightMm, pairLayouts } from './pair.js';
import { REMEMBERED } from './remembered.js';

const els = {
  small: byId('chart-small'),
  large: byId('chart-large'),
  smallNote: byId('small-note'),
  largeNote: byId('large-note'),
  rows: byId('rows'),
  rowsVal: byId('rows-val'),
  cols: byId('cols'),
  colsVal: byId('cols-val'),
  smallHeight: byId('small-height'),
  smallHeightVal: byId('small-height-val'),
  ratio: byId('size-ratio'),
  ratioVal: byId('size-ratio-val'),
  spacing: byId('spacing'),
  spacingVal: byId('spacing-val'),
  letterSet: byId('letter-set'),
  showNumbers: byId('show-numbers'),
  showColumnNumbers: byId('show-column-numbers'),
  btnGenerate: byId('btn-generate'),
  btnPrintSmall: byId('btn-print-small'),
  btnPrintLarge: byId('btn-print-large'),
  btnResetSettings: byId('btn-reset-settings'),
};

// The current letters, kept so size and spacing changes do not reshuffle them. Both charts draw this grid.
let grid = [];

const smallHeightMm = () => fromDisplay(parseFloat(els.smallHeight.value), view.units());

// What the note under a chart's title says: its size, how it prints, and whether the letters are too small
function describeChart(layout, units) {
  const page = pageNote(layout.chartW, layout.chartH, { rowsStayWhole: true, units });
  return {
    text:
      sizeSummary(layout.chartW, layout.chartH, units) +
      page.text +
      (layout.tooSmall ? ' Warning: letters this small may be too small to read.' : ''),
    warn: page.warn || layout.tooSmall,
  };
}

function render() {
  const numbers = els.showNumbers.checked;
  const colNumbers = els.showColumnNumbers.checked;
  const layouts = pairLayouts({
    rows: grid.length,
    cols: grid[0].length,
    smallHeightMm: smallHeightMm(),
    ratio: parseFloat(els.ratio.value),
    spacing: parseFloat(els.spacing.value),
    numbers,
    colNumbers,
  });

  drawChart(els.small, grid, layouts.small, { numbers, colNumbers });
  drawChart(els.large, grid, layouts.large, { numbers, colNumbers });

  const units = view.units();
  for (const [layout, note] of [[layouts.small, els.smallNote], [layouts.large, els.largeNote]]) {
    const { text, warn } = describeChart(layout, units);
    setNote(note, text, warn);
  }
}

function generate() {
  grid = buildGrid(parseInt(els.rows.value), parseInt(els.cols.value), LETTER_SETS[els.letterSet.value]);
  render();
}

function syncDisplays() {
  const units = view.units();
  els.rowsVal.textContent = els.rows.value;
  els.colsVal.textContent = els.cols.value;
  const digits = LENGTH_CONTROLS['small-height'][units].digits;
  els.smallHeightVal.textContent = lengthLabel(els.smallHeight.value, units, digits);
  const ratio = parseFloat(els.ratio.value);
  const largeLetters = lengthLabel(toDisplay(largeHeightMm(smallHeightMm(), ratio), units), units, digits);
  els.ratioVal.textContent = `${ratio.toFixed(2)}× (letters ${largeLetters})`;
  els.spacingVal.textContent = parseFloat(els.spacing.value).toFixed(1) + '×';
}

// Sizes, spacing and numbers redraw the same letters; rows, columns and the letter set make a new grid.
for (const input of [els.smallHeight, els.ratio, els.spacing, els.showNumbers, els.showColumnNumbers]) {
  input.addEventListener('input', () => { syncDisplays(); render(); });
}
for (const input of [els.rows, els.cols, els.letterSet]) {
  input.addEventListener('input', () => { syncDisplays(); generate(); });
}
els.btnGenerate.addEventListener('click', generate);

// Print one chart: the other is hidden for the print (see style.css) and shown again afterwards. The
// browser's own Print prints both, each on its own page.
function printOnly(which) {
  document.body.dataset.print = which;
  window.print();
}
window.addEventListener('afterprint', () => delete document.body.dataset.print);
els.btnPrintSmall.addEventListener('click', () => printOnly('small'));
els.btnPrintLarge.addEventListener('click', () => printOnly('large'));

// The length control shows the units chosen in the header. Set it up before restoring saved settings.
const view = useUnits(LENGTH_CONTROLS, () => {
  remember.save();
  syncDisplays();
  render();
});

// Controls come back as the user last left them, and are saved on this device as they change
const remember = rememberControls('matched-hart-pair', REMEMBERED, { lengths: LENGTH_CONTROLS });
remember.restore();
remember.watch();
els.btnResetSettings.addEventListener('click', () => {
  remember.reset();
  syncDisplays();
  generate();
});

syncDisplays();
generate();
