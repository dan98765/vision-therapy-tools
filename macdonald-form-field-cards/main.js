// Macdonald Form Field Cards: reads the controls, draws the card, and turns one ring when asked.

import { CAP_HEIGHT, MIN_LETTER_MM, UPPER, UPPER_CONSONANTS, VOWELS } from '../shared/letters.js';
import { inchLabel, letterUseNote, mmAsInches, ringCountsNote, sizeSummary } from '../shared/format.js';
import { bindPrint, byId, setNote } from '../shared/page.js';
import { pageNote } from '../shared/paper.js';
import { inchesToMm } from '../shared/units.js';
import { BORDER_MM, cardGeometry, fitRings, placeLetters, ringCounts } from './layout.js';
import { advanceAngle, secondsPerTurn, turnedPosition } from './motion.js';

const LETTER_SETS = {
  all: UPPER,
  consonants: UPPER_CONSONANTS,
  vowels: VOWELS,
};

const els = {
  card: byId('card'),
  rings: byId('rings'),
  ringsVal: byId('rings-val'),
  lettersPerRing: byId('letters-per-ring'),
  lettersVal: byId('letters-per-ring-val'),
  cardSize: byId('card-size'),
  cardSizeVal: byId('card-size-val'),
  aspectRatio: byId('aspect-ratio'),
  baseLetter: byId('base-letter'),
  baseLetterVal: byId('base-letter-val'),
  scaleFactor: byId('scale-factor'),
  scaleFactorVal: byId('scale-factor-val'),
  letterSet: byId('letter-set'),
  allLetters: byId('all-letters'),
  noRepeats: byId('no-repeats'),
  showDot: byId('show-dot'),
  movingRing: byId('moving-ring'),
  direction: byId('ring-direction'),
  speed: byId('ring-speed'),
  speedVal: byId('ring-speed-val'),
  btnGenerate: byId('btn-generate'),
  btnMotion: byId('btn-motion'),
  btnPrint: byId('btn-print'),
  note: byId('card-note'),
  motionNote: byId('motion-note'),
};

function div(className) {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

// The card as drawn: each letter with its element, plus the centre the rings turn about
const card = { letters: [], cx: 0, cy: 0 };

// The moving ring: how far it has turned from where it was drawn, and whether it is turning now
const motion = { turn: 0, running: false, lastTime: 0, frame: 0 };

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function generateCard() {
  stopMotion();
  motion.turn = 0;

  const numRings = parseInt(els.rings.value);
  const lettersPerRing = parseInt(els.lettersPerRing.value);
  const baseEm = inchesToMm(parseFloat(els.baseLetter.value)) / CAP_HEIGHT;
  const scaleFactor = parseFloat(els.scaleFactor.value);

  const geo = cardGeometry(inchesToMm(parseFloat(els.cardSize.value)), parseFloat(els.aspectRatio.value));
  const pool = LETTER_SETS[els.letterSet.value];
  // "Use every letter once" spreads the whole set over the rings, so the rings hold different numbers
  const allLetters = els.allLetters.checked;
  const counts = allLetters ? ringCounts(pool.length, numRings) : null;
  const perRing = counts ?? lettersPerRing;
  const noRepeats = allLetters || els.noRepeats.checked;
  const { k, rings } = fitRings(counts ? counts.length : numRings, perRing, baseEm, scaleFactor, geo.available);
  const letters = placeLetters(rings, perRing, geo.cx, geo.cy, pool, Math.random, { noRepeats });

  els.card.style.width = geo.width + 'mm';
  els.card.style.height = geo.height + 'mm';
  els.card.style.setProperty('--border-mm', BORDER_MM);
  els.card.textContent = '';

  if (els.showDot.checked) {
    els.card.append(div('center-dot'), div('center-circle'));
  }

  card.cx = geo.cx;
  card.cy = geo.cy;
  card.letters = letters.map(placed => {
    const el = div('letter');
    el.textContent = placed.letter;
    el.style.fontSize = placed.font.toFixed(3) + 'mm';
    els.card.append(el);
    const item = { ...placed, el };
    positionLetter(item, placed.x, placed.y);
    return item;
  });

  fillRingChoices(rings.length);
  updateMotionControls();

  const smallestMm = rings[0].font * CAP_HEIGHT;
  const tooSmall = smallestMm < MIN_LETTER_MM;
  const page = pageNote(geo.width, geo.height);
  setNote(
    els.note,
    sizeSummary(geo.width, geo.height) +
      page.text +
      (noRepeats ? ' ' + letterUseNote(letters.length, pool.length) : '') +
      (counts ? ' ' + ringCountsNote(counts, numRings) : '') +
      (k < 0.995 ? ` Letters were shrunk to ${Math.round(k * 100)}% of the requested size to fit the card.` : '') +
      (tooSmall
        ? ` Warning: the innermost letters are only ${mmAsInches(smallestMm, 3)} tall, which may be too small to read. Use a bigger card or fewer rings or letters per ring.`
        : ''),
    tooSmall || page.warn,
  );
}

function positionLetter(item, x, y) {
  item.el.style.left = x.toFixed(3) + 'mm';
  item.el.style.top = y.toFixed(3) + 'mm';
}

// ── Moving ring ──────────────────────────────────────────

// The index of the ring chosen to move (0 is the innermost), or null for none
function movingRing() {
  return els.movingRing.value === '' ? null : Number(els.movingRing.value);
}

// One choice per ring on the card, keeping the current choice if that ring still exists
function fillRingChoices(count) {
  const keep = movingRing();
  els.movingRing.textContent = '';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'None (every ring still)';
  els.movingRing.append(none);
  for (let i = 0; i < count; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    const place = i === 0 ? ' (innermost)' : i === count - 1 ? ' (outermost)' : '';
    option.textContent = `Ring ${i + 1}${place}`;
    els.movingRing.append(option);
  }
  els.movingRing.value = keep !== null && keep < count ? String(keep) : '';
}

// Place the moving ring's letters for the current turn
function drawMovingRing() {
  const ring = movingRing();
  if (ring === null) return;
  for (const item of card.letters) {
    if (item.ring !== ring) continue;
    const { x, y } = turnedPosition(item, motion.turn, card.cx, card.cy);
    positionLetter(item, x, y);
  }
}

function step(time) {
  if (!motion.running) return;
  motion.turn = advanceAngle(motion.turn, time - motion.lastTime, Number(els.speed.value), els.direction.value);
  motion.lastTime = time;
  drawMovingRing();
  motion.frame = requestAnimationFrame(step);
}

function startMotion() {
  if (motion.running || movingRing() === null) return;
  motion.running = true;
  motion.lastTime = performance.now();
  motion.frame = requestAnimationFrame(step);
  updateMotionControls();
}

// The ring stays where it has got to, and starts from there again
function stopMotion() {
  if (!motion.running) return;
  motion.running = false;
  cancelAnimationFrame(motion.frame);
  updateMotionControls();
}

function updateMotionControls() {
  els.btnMotion.disabled = movingRing() === null;
  els.btnMotion.textContent = motion.running ? 'Stop moving ring' : 'Start moving ring';
  els.motionNote.textContent =
    'The chosen ring turns round the center only while it is running: press Start moving ring, and stop it with the ' +
    'same button or the Escape key. Letters stay upright. Printing keeps the ring where it is.' +
    (reducedMotion.matches ? ' Your device asks for reduced motion, so nothing moves until you press Start.' : '');
}

els.movingRing.addEventListener('change', () => {
  // Another ring (or none) was chosen: the old one goes back, and the new one starts from where it was drawn
  for (const item of card.letters) positionLetter(item, item.x, item.y);
  motion.turn = 0;
  if (movingRing() === null) stopMotion();
  updateMotionControls();
});
els.btnMotion.addEventListener('click', () => (motion.running ? stopMotion() : startMotion()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') stopMotion();
});
reducedMotion.addEventListener('change', updateMotionControls);

// ── Controls ─────────────────────────────────────────────

function syncDisplays() {
  // With every letter used once, the rings hold different numbers, so the letters-per-ring control is not used
  const allLetters = els.allLetters.checked;
  els.lettersPerRing.disabled = allLetters;
  els.noRepeats.disabled = allLetters;
  els.ringsVal.textContent = els.rings.value;
  els.lettersVal.textContent = allLetters ? 'varies' : els.lettersPerRing.value;
  els.cardSizeVal.textContent = inchLabel(els.cardSize.value, 1);
  els.baseLetterVal.textContent = inchLabel(els.baseLetter.value);
  els.scaleFactorVal.textContent = parseFloat(els.scaleFactor.value).toFixed(2);
  const turns = Number(els.speed.value);
  els.speedVal.textContent = `${turns} turns/min (${secondsPerTurn(turns).toFixed(1)} s a turn)`;
}

// Sliders only update their readouts; "Generate Card" applies them (each card is random). The speed and
// direction apply straight away, because the ring reads them on every frame.
for (const input of [els.rings, els.lettersPerRing, els.cardSize, els.baseLetter, els.scaleFactor, els.allLetters, els.speed]) {
  input.addEventListener('input', syncDisplays);
}
els.btnGenerate.addEventListener('click', generateCard);
bindPrint(els.btnPrint);

syncDisplays();
generateCard();
