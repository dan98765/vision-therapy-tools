// Letter size calculator: three linked quantities (letter height, viewing distance, visual angle). The user
// chooses which to work out and types in the other two.

import { mmLabel } from '../shared/format.js';
import { useUnits } from '../shared/length-controls.js';
import { CAP_HEIGHT } from '../shared/letters.js';
import { byId, setNote } from '../shared/page.js';
import { PREFILL_PAGES, letterLink } from '../shared/prefill.js';
import { rememberControls } from '../shared/remember.js';
import { UNIT_WORDS, fromDisplay, toDisplay } from '../shared/units.js';
import { ANGLE_UNITS, angleFromArcmin, angleToArcmin, convertAngle, restoredAngleArcmin, solve } from './angle.js';
import { LENGTH_CONTROLS } from './lengths.js';
import { REMEMBERED } from './remembered.js';

const els = {
  solve: byId('solve-for'),
  angleUnit: byId('angle-unit'),
  height: byId('letter-height'),
  distance: byId('viewing-distance'),
  angle: byId('visual-angle'),
  heightLabel: byId('letter-height-label'),
  distanceLabel: byId('viewing-distance-label'),
  angleLabel: byId('visual-angle-label'),
  note: byId('calc-note'),
  resHeight: byId('res-height'),
  resFont: byId('res-font'),
  resDistance: byId('res-distance'),
  resAngle: byId('res-angle'),
  usePanel: byId('use-panel'),
  btnResetSettings: byId('btn-reset-settings'),
};

// The three quantities: the box and label for each, and the words used in the label
const QUANTITIES = {
  height: { input: els.height, label: els.heightLabel, name: 'Letter height', spec: LENGTH_CONTROLS['letter-height'] },
  distance: { input: els.distance, label: els.distanceLabel, name: 'Viewing distance', spec: LENGTH_CONTROLS['viewing-distance'] },
  angle: { input: els.angle, label: els.angleLabel, name: 'Visual angle' },
};

const angleUnit = () => els.angleUnit.value;
let shownAngleUnit = angleUnit(); // the unit the angle box is showing, to convert it when the user changes it

// ── Reading the boxes ────────────────────────────────────

function readNumber(input) {
  return input.value.trim() === '' ? null : Number(input.value);
}

// A box the user types a length into, as millimetres, or the reason it cannot be used
function readLength(key) {
  const { input, name, spec } = QUANTITIES[key];
  const units = view.units();
  const { min, max } = spec[units];
  const value = readNumber(input);
  if (value === null || !Number.isFinite(value)) return { problem: `Enter the ${name.toLowerCase()}.` };
  if (value < min || value > max) {
    return { problem: `${name} should be between ${min} and ${max} ${UNIT_WORDS[units].plural}.` };
  }
  return { value: fromDisplay(value, units) };
}

// The angle box as minutes of arc, or the reason it cannot be used
function readAngle() {
  const { min, max, name } = ANGLE_UNITS[angleUnit()];
  const value = readNumber(els.angle);
  if (value === null || !Number.isFinite(value)) return { problem: 'Enter the visual angle.' };
  if (value < min || value > max) return { problem: `The visual angle should be between ${min} and ${max} ${name}.` };
  return { value: angleToArcmin(value, angleUnit()) };
}

const read = key => (key === 'angle' ? readAngle() : readLength(key));

// ── Showing the answer ───────────────────────────────────

function renderLabels() {
  const units = view.units();
  const solving = els.solve.value;
  for (const [key, { input, label, name }] of Object.entries(QUANTITIES)) {
    const unit = key === 'angle' ? ANGLE_UNITS[angleUnit()].name : UNIT_WORDS[units].plural;
    label.textContent = `${name} (${unit})${key === solving ? ', the answer' : ''}`;
    input.readOnly = key === solving;
  }
}

function showProblem(text) {
  setNote(els.note, text, true);
  for (const el of [els.resHeight, els.resFont, els.resDistance, els.resAngle]) el.textContent = '—';
  els.usePanel.hidden = true;
}

// Write the worked-out quantity into its box, rounded to the decimals that box shows
function showSolved(key, solved) {
  const units = view.units();
  if (key === 'angle') {
    const spec = ANGLE_UNITS[angleUnit()];
    els.angle.value = String(Number(angleFromArcmin(solved.angleArcmin, angleUnit()).toFixed(spec.digits)));
  } else {
    const { input, spec } = QUANTITIES[key];
    const mm = key === 'height' ? solved.height : solved.distance;
    input.value = String(Number(toDisplay(mm, units).toFixed(spec[units].digits)));
  }
}

function calculate() {
  renderLabels();
  const solving = els.solve.value;
  const given = {};
  for (const key of Object.keys(QUANTITIES).filter(k => k !== solving)) {
    const result = read(key);
    if (result.problem) return showProblem(result.problem);
    given[key] = result.value;
  }

  const solved = solve(solving, { height: given.height, distance: given.distance, angleArcmin: given.angle });
  if (![solved.height, solved.distance, solved.angleArcmin].every(Number.isFinite)) {
    return showProblem('Those two numbers give no answer. Try a smaller angle.');
  }
  showSolved(solving, solved);

  const units = view.units();
  els.resHeight.textContent = mmLabel(solved.height, units, 'small');
  els.resFont.textContent = mmLabel(solved.height / CAP_HEIGHT, units, 'small');
  els.resDistance.textContent = mmLabel(solved.distance, units, 'page');
  els.resAngle.textContent = `${solved.angleArcmin.toFixed(2)} minutes of arc (${(solved.angleArcmin / 60).toFixed(3)}°)`;
  setNote(els.note, '', false);

  for (const folder of PREFILL_PAGES) byId(`link-${folder}`).href = letterLink(`../${folder}/`, solved.height);
  els.usePanel.hidden = false;

  // The angle is kept in minutes of arc, whichever way it is written (see remembered.js)
  remember.setExtra('angle', { arcmin: Number(solved.angleArcmin.toFixed(4)) });
}

// ── The angle box ────────────────────────────────────────

// Give the angle box the range of the unit it is showing
function applyAngleUnit() {
  const { min, max, step } = ANGLE_UNITS[angleUnit()];
  els.angle.min = String(min);
  els.angle.max = String(max);
  els.angle.step = String(step);
}

els.angleUnit.addEventListener('change', () => {
  const previous = shownAngleUnit;
  shownAngleUnit = angleUnit();
  applyAngleUnit();
  const value = readNumber(els.angle);
  els.angle.value = String(value === null ? ANGLE_UNITS[shownAngleUnit].value : convertAngle(value, previous, shownAngleUnit));
  calculate();
});

// ── Events, units and remembering ────────────────────────

for (const input of [els.height, els.distance, els.angle]) input.addEventListener('input', calculate);
els.solve.addEventListener('change', calculate);

// The length boxes show the units chosen in the header. Set them up before restoring saved settings.
const view = useUnits(LENGTH_CONTROLS, () => {
  remember.save();
  calculate();
});

const remember = rememberControls('letter-size-calculator', REMEMBERED, { lengths: LENGTH_CONTROLS });
const saved = remember.restore();
remember.watch();

// The angle comes back in the unit that was restored, from the minutes of arc it was kept in
shownAngleUnit = angleUnit();
applyAngleUnit();
const restoredArcmin = restoredAngleArcmin(saved.angle?.arcmin);
const startAngle = restoredArcmin === null
  ? ANGLE_UNITS[shownAngleUnit].value
  : Number(angleFromArcmin(restoredArcmin, shownAngleUnit).toFixed(ANGLE_UNITS[shownAngleUnit].digits));
els.angle.value = String(startAngle);

els.btnResetSettings.addEventListener('click', () => {
  remember.reset();
  shownAngleUnit = angleUnit();
  applyAngleUnit();
  els.angle.value = String(ANGLE_UNITS[shownAngleUnit].value);
  calculate();
});

calculate();
