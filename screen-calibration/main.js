// Screen calibration: the user matches an on-screen box to an object of known size, and the page
// works out pixels per real millimetre and draws a ruler to check it. Nothing is stored.

import {
  NOMINAL_PX_PER_MM,
  REFERENCES,
  boxWidthRange,
  calibrationStatus,
  clampWidth,
  describeCalibration,
  mmToPx,
  pxPerMm,
  referenceLength,
  stepPrecisionPercent,
} from '../shared/calibration.js';
import { byId, setNote } from '../shared/page.js';
import { TICK_MM, rulerTicks } from './ruler.js';

const DEFAULT_BOX_HEIGHT_PX = 56; // for references that have no known height

// The check drawing: a ruler hanging from the top edge, and a square below it. Lengths in real mm unless
// the name ends in Px, which are screen pixels for the labels and margins.
const DRAWING = {
  rulerMm: 150,
  squareMm: 50,
  marginPx: 14,
  labelRoomPx: 20,
  labelBaselinePx: 14,
  squareGapPx: 12,
  bottomPx: 8,
  ink: '#111',
  accent: '#2563eb',
};

const NOTES = {
  unadjusted: {
    text: 'Not adjusted yet: this is the size your browser assumes, which is usually a little off. Match the box to your object.',
    warn: false,
  },
  calibrated: {
    text: 'Calibrated for this browser zoom and display. If you zoom or move this window to another screen, match the box again.',
    warn: false,
  },
  stale: {
    text: 'The browser zoom or display has changed since you matched the box, so the result may no longer be true. Match the box again.',
    warn: true,
  },
};

const els = {
  reference: byId('reference'),
  customGroup: byId('custom-group'),
  customMm: byId('custom-mm'),
  boxWidth: byId('box-width'),
  boxWidthVal: byId('box-width-val'),
  narrower: byId('btn-narrower'),
  wider: byId('btn-wider'),
  reset: byId('btn-reset'),
  box: byId('reference-box'),
  ruler: byId('ruler'),
  note: byId('calibration-note'),
  resPpmm: byId('res-ppmm'),
  resPpi: byId('res-ppi'),
  res100: byId('res-100'),
  resCss: byId('res-css'),
  resPrecision: byId('res-precision'),
};

// The calibration is `ppmm`, CSS pixels per real millimetre. It starts at what the browser assumes, which
// is usually a little off, until the user adjusts the box.
const state = {
  ppmm: NOMINAL_PX_PER_MM,
  adjusted: false,
  ratioWhenAdjusted: window.devicePixelRatio, // to notice a later zoom or display change
};

const referenceMm = () => referenceLength(els.reference.value, els.customMm.value);

// Set the slider range and position for the current reference. The calibration is kept when the reference
// changes, so the slider moves to the width the new reference has under the same pixels per millimetre.
function syncSlider() {
  const mm = referenceMm();
  const range = boxWidthRange(mm);
  els.boxWidth.min = String(range.min);
  els.boxWidth.max = String(range.max);
  const wanted = mmToPx(mm, state.ppmm);
  const clamped = clampWidth(wanted, range);
  els.boxWidth.value = String(clamped);
  // Only re-derive the calibration if the range forced a different width: the slider snaps to half
  // pixels, and reading that back would nudge an exact value
  if (clamped !== wanted) state.ppmm = pxPerMm(clamped, mm);
}

// The user moved the box to `widthPx`.
function adjust(widthPx) {
  const clamped = clampWidth(widthPx, boxWidthRange(referenceMm()));
  els.boxWidth.value = String(clamped);
  state.ppmm = pxPerMm(clamped, referenceMm());
  state.adjusted = true;
  state.ratioWhenAdjusted = window.devicePixelRatio;
  render();
}

// ── Drawing ──────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

const svgLine = (x1, y1, x2, y2) =>
  svgElement('line', { x1, y1, x2, y2, stroke: DRAWING.ink, 'stroke-width': 1 });

function svgText(x, y, content, { size, fill }) {
  const element = svgElement('text', { x, y, 'text-anchor': 'middle', 'font-size': size, fill });
  element.textContent = content;
  return element;
}

function drawRuler() {
  const { ppmm } = state;
  const { rulerMm, squareMm, marginPx, labelRoomPx, labelBaselinePx, squareGapPx, bottomPx } = DRAWING;
  const squarePx = mmToPx(squareMm, ppmm);
  const rulerHeightPx = mmToPx(TICK_MM.cm, ppmm) + labelRoomPx;
  const widthPx = mmToPx(rulerMm, ppmm) + 2 * marginPx;
  const heightPx = rulerHeightPx + squareGapPx + squarePx + bottomPx;
  const squareTop = rulerHeightPx + squareGapPx;

  els.ruler.replaceChildren();
  els.ruler.setAttribute('width', widthPx.toFixed(2));
  els.ruler.setAttribute('height', heightPx.toFixed(2));
  els.ruler.setAttribute('viewBox', `0 0 ${widthPx.toFixed(2)} ${heightPx.toFixed(2)}`);

  els.ruler.append(svgLine(marginPx, 0.5, marginPx + mmToPx(rulerMm, ppmm), 0.5));
  for (const tick of rulerTicks(rulerMm)) {
    const x = marginPx + mmToPx(tick.mm, ppmm);
    const tickPx = mmToPx(tick.lengthMm, ppmm);
    els.ruler.append(svgLine(x, 0, x, tickPx));
    if (tick.label) els.ruler.append(svgText(x, tickPx + labelBaselinePx, tick.label, { size: 11, fill: DRAWING.ink }));
  }

  els.ruler.append(svgElement('rect', {
    x: marginPx, y: squareTop, width: squarePx, height: squarePx, fill: 'none', stroke: DRAWING.accent, 'stroke-width': 1.5,
  }));
  els.ruler.append(svgText(marginPx + squarePx / 2, squareTop + squarePx / 2 + 4, `${squareMm} mm`, { size: 12, fill: DRAWING.accent }));
  els.ruler.setAttribute('aria-label',
    `A ruler ${rulerMm} millimetres long and a ${squareMm} millimetre square, drawn with your calibration`);
}

function renderBox(mm) {
  const { heightMm } = REFERENCES[els.reference.value];
  const widthPx = mmToPx(mm, state.ppmm);
  els.box.style.width = `${widthPx}px`;
  els.box.style.height = `${heightMm ? mmToPx(heightMm, state.ppmm) : DEFAULT_BOX_HEIGHT_PX}px`;
  els.boxWidthVal.textContent = `${widthPx.toFixed(1)} px`;
  return widthPx;
}

function percentText(percent) {
  return `${Math.abs(percent).toFixed(1)}% ${percent >= 0 ? 'too small' : 'too large'}`;
}

function renderResults(boxWidthPx) {
  const numbers = describeCalibration(state.ppmm);
  els.resPpmm.textContent = numbers.pxPerMm.toFixed(3);
  els.resPpi.textContent = numbers.pxPerInch.toFixed(1);
  els.res100.textContent = `${numbers.hundredMmInPx.toFixed(1)} px`;
  els.resCss.textContent = percentText(numbers.cssMmTooSmallPercent);
  els.resPrecision.textContent = `changes it by ${stepPrecisionPercent(boxWidthPx).toFixed(2)}%`;
}

function updateNote() {
  const status = calibrationStatus({
    adjusted: state.adjusted,
    calibratedRatio: state.ratioWhenAdjusted,
    currentRatio: window.devicePixelRatio,
  });
  setNote(els.note, NOTES[status].text, NOTES[status].warn);
}

function render() {
  renderResults(renderBox(referenceMm()));
  drawRuler();
  updateNote();
}

// ── Events ───────────────────────────────────────────────

els.boxWidth.addEventListener('input', () => adjust(Number(els.boxWidth.value)));
els.narrower.addEventListener('click', () => adjust(Number(els.boxWidth.value) - 1));
els.wider.addEventListener('click', () => adjust(Number(els.boxWidth.value) + 1));

function referenceChanged() {
  els.customGroup.hidden = els.reference.value !== 'custom';
  syncSlider();
  render();
}
els.reference.addEventListener('change', referenceChanged);
els.customMm.addEventListener('input', referenceChanged);

els.reset.addEventListener('click', () => {
  state.ppmm = NOMINAL_PX_PER_MM;
  state.adjusted = false;
  syncSlider();
  render();
});

// Zooming the page, or moving it to a screen with a different pixel ratio, changes devicePixelRatio. That
// does not always fire a resize event (moving to another monitor may not), so also watch the ratio itself
// with a media query. A "resolution" query only reports a change away from the value it was built with,
// so it is built again each time it fires.
function watchPixelRatio() {
  const query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  query.addEventListener('change', () => {
    updateNote();
    watchPixelRatio();
  }, { once: true });
}
window.addEventListener('resize', updateNote);
watchPixelRatio();

syncSlider();
render();
