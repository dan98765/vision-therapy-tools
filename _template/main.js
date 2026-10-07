// Starting point for a new exercise: read the controls, draw into #exercise.
// Keep maths that can be tested in its own file (like grid.js or layout.js in the
// other exercises) and add a test for it in tests/.

import { mmLabel } from '../shared/format.js';
import { bindPrint, byId, setNote } from '../shared/page.js';

const els = {
  exercise: byId('exercise'),
  size: byId('size'),
  sizeVal: byId('size-val'),
  btnGenerate: byId('btn-generate'),
  btnPrint: byId('btn-print'),
  note: byId('exercise-note'),
};

function generate() {
  // TODO: draw the exercise into els.exercise
  els.exercise.textContent = `Size ${els.size.value}`;
  setNote(els.note, `Size is ${mmLabel(els.size.value)}.`);
}

function syncDisplays() {
  els.sizeVal.textContent = els.size.value;
}

els.size.addEventListener('input', syncDisplays);
els.btnGenerate.addEventListener('click', generate);
bindPrint(els.btnPrint);

syncDisplays();
generate();
