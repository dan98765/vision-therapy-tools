// Starting point for a new exercise: read the controls, draw into #exercise.
// Keep maths that can be tested in its own file (like grid.js or layout.js in the
// other exercises) and add a test for it in tests/.

import { bindPrint, byId, setNote } from '../shared/page.js';
import { rememberControls } from '../shared/remember.js';
import { REMEMBERED } from './remembered.js';

const els = {
  exercise: byId('exercise'),
  size: byId('size'),
  sizeVal: byId('size-val'),
  btnGenerate: byId('btn-generate'),
  btnPrint: byId('btn-print'),
  btnResetSettings: byId('btn-reset-settings'),
  note: byId('exercise-note'),
};

function generate() {
  // TODO: draw the exercise into els.exercise
  els.exercise.textContent = `Size ${els.size.value}`;
  setNote(els.note, `Size is ${els.size.value}.`);
}

function syncDisplays() {
  els.sizeVal.textContent = els.size.value;
}

els.size.addEventListener('input', syncDisplays);
els.btnGenerate.addEventListener('click', generate);
bindPrint(els.btnPrint);

// Controls come back as the user last left them. Name this exercise's folder (not 'template') below.
const remember = rememberControls('template', REMEMBERED);
remember.restore();
remember.watch();
els.btnResetSettings.addEventListener('click', () => {
  remember.reset();
  syncDisplays();
  generate();
});

syncDisplays();
generate();
