// Screen calibration: the user matches an on-screen box to an object of known size, and the page
// works out pixels per real millimetre and draws a ruler to check it. Nothing is stored.

import {
  NOMINAL_PX_PER_MM,
  REFERENCES,
  describeCalibration,
  isStale,
  mmToPx,
  nominalWidthPx,
  pxPerMm,
  referenceLength,
  stepPrecisionPercent,
} from '../shared/calibration.js';
import { byId, setNote } from '../shared/page.js';
import { TICK_MM, rulerTicks } from './ruler.js';

const RULER_MM = 150;
const SQUARE_MM = 50;
const DEFAULT_BOX_HEIGHT_PX = 56; // for references with no known height

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

// The calibration: CSS pixels per real millimetre. It starts at what the browser assumes, which is
// usually a little off, until the user adjusts the box.
let ppmm = NOMINAL_PX_PER_MM;
let adjusted = false;
let ratioWhenAdjusted = window.devicePixelRatio;

const referenceMm = () => referenceLength(els.reference.value, els.customMm.value);

// Slider range: from half to double the width the browser would assume. The calibration is kept when
// the reference changes, so the slider is set to the matching width for the new reference.
function syncSlider() {
  const nominal = nominalWidthPx(referenceMm());
  els.boxWidth.min = String(Math.floor(nominal * 0.5));
  els.boxWidth.max = String(Math.ceil(nominal * 2));
  const wanted = mmToPx(referenceMm(), ppmm);
  const clamped = Math.min(Number(els.boxWidth.max), Math.max(Number(els.boxWidth.min), wanted));
  els.boxWidth.value = String(clamped);
  // Only re-derive the calibration if the slider range forced a different width: the slider snaps to
  // half pixels, and reading that back would nudge an exact value
  if (clamped !== wanted) ppmm = pxPerMm(clamped, referenceMm());
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

// A ruler hanging from the top edge, with centimetre labels, and a square, all drawn in real mm.
function drawRuler() {
  const pad = 14;
  const labelRoom = 20;
  const gap = 12;
  const squarePx = mmToPx(SQUARE_MM, ppmm);
  const width = mmToPx(RULER_MM, ppmm) + 2 * pad;
  const rulerHeight = mmToPx(TICK_MM.cm, ppmm) + labelRoom;
  const height = rulerHeight + gap + squarePx + 8;

  els.ruler.replaceChildren();
  els.ruler.setAttribute('width', width.toFixed(2));
  els.ruler.setAttribute('height', height.toFixed(2));
  els.ruler.setAttribute('viewBox', `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`);

  els.ruler.append(svgElement('line', {
    x1: pad, y1: 0.5, x2: pad + mmToPx(RULER_MM, ppmm), y2: 0.5, stroke: '#111', 'stroke-width': 1,
  }));
  for (const tick of rulerTicks(RULER_MM)) {
    const x = pad + mmToPx(tick.mm, ppmm);
    els.ruler.append(svgElement('line', {
      x1: x, y1: 0, x2: x, y2: mmToPx(tick.lengthMm, ppmm), stroke: '#111', 'stroke-width': 1,
    }));
    if (tick.label) {
      const label = svgElement('text', {
        x, y: mmToPx(tick.lengthMm, ppmm) + 14, 'text-anchor': 'middle', 'font-size': 11, fill: '#111',
      });
      label.textContent = tick.label;
      els.ruler.append(label);
    }
  }
  els.ruler.append(svgElement('rect', {
    x: pad, y: rulerHeight + gap, width: squarePx, height: squarePx, fill: 'none', stroke: '#2563eb', 'stroke-width': 1.5,
  }));
  const squareLabel = svgElement('text', {
    x: pad + squarePx / 2, y: rulerHeight + gap + squarePx / 2 + 4, 'text-anchor': 'middle', 'font-size': 12, fill: '#2563eb',
  });
  squareLabel.textContent = `${SQUARE_MM} mm`;
  els.ruler.append(squareLabel);
  els.ruler.setAttribute('aria-label',
    `A ruler ${RULER_MM} millimetres long and a ${SQUARE_MM} millimetre square, drawn with your calibration`);
}

function percentText(value) {
  return `${Math.abs(value).toFixed(1)}% ${value >= 0 ? 'too small' : 'too large'}`;
}

function render() {
  const mm = referenceMm();
  const widthPx = mmToPx(mm, ppmm);
  const reference = REFERENCES[els.reference.value];
  els.box.style.width = `${widthPx}px`;
  els.box.style.height = `${reference.heightMm ? mmToPx(reference.heightMm, ppmm) : DEFAULT_BOX_HEIGHT_PX}px`;
  els.boxWidthVal.textContent = `${widthPx.toFixed(1)} px`;

  const numbers = describeCalibration(ppmm);
  els.resPpmm.textContent = numbers.pxPerMm.toFixed(3);
  els.resPpi.textContent = numbers.pxPerInch.toFixed(1);
  els.res100.textContent = `${numbers.hundredMmInPx.toFixed(1)} px`;
  els.resCss.textContent = percentText(numbers.cssMmTooSmallPercent);
  els.resPrecision.textContent = `changes it by ${stepPrecisionPercent(widthPx).toFixed(2)}%`;

  drawRuler();
  updateNote();
}

function updateNote() {
  if (adjusted && isStale(ratioWhenAdjusted, window.devicePixelRatio)) {
    setNote(els.note,
      'The browser zoom or display has changed since you matched the box, so the result may no longer be true. Match the box again.',
      true);
  } else if (!adjusted) {
    setNote(els.note, 'Not adjusted yet: this is the size your browser assumes, which is usually a little off. Match the box to your object.');
  } else {
    setNote(els.note, 'Calibrated for this browser zoom and display. If you zoom or move this window to another screen, match the box again.');
  }
}

function adjust(widthPx) {
  const min = Number(els.boxWidth.min);
  const max = Number(els.boxWidth.max);
  const clamped = Math.min(max, Math.max(min, widthPx));
  els.boxWidth.value = String(clamped);
  ppmm = pxPerMm(clamped, referenceMm());
  adjusted = true;
  ratioWhenAdjusted = window.devicePixelRatio;
  render();
}

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
  ppmm = NOMINAL_PX_PER_MM;
  adjusted = false;
  syncSlider();
  render();
});

// Zooming the page, or moving it to a screen with a different pixel ratio, changes devicePixelRatio. That does
// not always fire a resize event (moving to another monitor may not), so also watch the ratio itself with a
// media query. A "resolution" query only reports a change away from the value it was built with, so
// it is built again each time it fires.
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
