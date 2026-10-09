// Macdonald Form Field Cards: reads the controls, draws the card.

import { CAP_HEIGHT, MIN_LETTER_MM, UPPER, UPPER_CONSONANTS, VOWELS } from '../shared/letters.js';
import { mmLabel, sizeSummary } from '../shared/format.js';
import { bindPrint, byId, setNote } from '../shared/page.js';
import { pageNote } from '../shared/paper.js';
import { BORDER_MM, cardGeometry, fitRings, placeLetters } from './layout.js';

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
  showDot: byId('show-dot'),
  btnGenerate: byId('btn-generate'),
  btnPrint: byId('btn-print'),
  note: byId('card-note'),
};

function div(className) {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

function generateCard() {
  const numRings = parseInt(els.rings.value);
  const lettersPerRing = parseInt(els.lettersPerRing.value);
  const baseEm = parseFloat(els.baseLetter.value) / CAP_HEIGHT;
  const scaleFactor = parseFloat(els.scaleFactor.value);

  const geo = cardGeometry(parseInt(els.cardSize.value), parseFloat(els.aspectRatio.value));
  const { k, rings } = fitRings(numRings, lettersPerRing, baseEm, scaleFactor, geo.available);
  const letters = placeLetters(rings, lettersPerRing, geo.cx, geo.cy, LETTER_SETS[els.letterSet.value]);

  els.card.style.width = geo.width + 'mm';
  els.card.style.height = geo.height + 'mm';
  els.card.style.setProperty('--border-mm', BORDER_MM);
  els.card.textContent = '';

  if (els.showDot.checked) {
    els.card.append(div('center-dot'), div('center-circle'));
  }

  for (const { letter, font, x, y } of letters) {
    const el = div('letter');
    el.textContent = letter;
    el.style.fontSize = font.toFixed(3) + 'mm';
    el.style.left = x.toFixed(3) + 'mm';
    el.style.top = y.toFixed(3) + 'mm';
    els.card.append(el);
  }

  const smallestMm = rings[0].font * CAP_HEIGHT;
  const tooSmall = smallestMm < MIN_LETTER_MM;
  const page = pageNote(geo.width, geo.height);
  setNote(
    els.note,
    sizeSummary(geo.width, geo.height) +
      page.text +
      (k < 0.995 ? ` Letters were shrunk to ${Math.round(k * 100)}% of the requested size to fit the card.` : '') +
      (tooSmall
        ? ` Warning: the innermost letters are only ${smallestMm.toFixed(2)} mm tall, which may be too small to read. Use a bigger card or fewer rings or letters per ring.`
        : ''),
    tooSmall || page.warn,
  );
}

function syncDisplays() {
  els.ringsVal.textContent = els.rings.value;
  els.lettersVal.textContent = els.lettersPerRing.value;
  els.cardSizeVal.textContent = els.cardSize.value + ' mm';
  els.baseLetterVal.textContent = mmLabel(els.baseLetter.value);
  els.scaleFactorVal.textContent = parseFloat(els.scaleFactor.value).toFixed(2);
}

// Sliders only update their readouts; "Generate Card" applies them (each card is random).
for (const input of [els.rings, els.lettersPerRing, els.cardSize, els.baseLetter, els.scaleFactor]) {
  input.addEventListener('input', syncDisplays);
}
els.btnGenerate.addEventListener('click', generateCard);
bindPrint(els.btnPrint);

syncDisplays();
generateCard();
