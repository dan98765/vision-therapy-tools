// The tick marks of the check ruler, in real millimetres whichever units are shown. No DOM access, so it can
// be tested.

import { MM_PER_INCH } from '../shared/units.js';

// Inch rulers have a tick every 1/16 inch; whole inches carry a label and finer divisions get shorter.
export const TICKS_PER_INCH = 16;

// Tick lengths in mm, so the ticks themselves are true to size once the screen is calibrated
export const TICK_MM = {
  in: {
    inch: 0.25 * MM_PER_INCH,
    half: 0.19 * MM_PER_INCH,
    quarter: 0.14 * MM_PER_INCH,
    eighth: 0.1 * MM_PER_INCH,
    sixteenth: 0.06 * MM_PER_INCH,
  },
  mm: { cm: 5, half: 3.5, mm: 2 },
};

function inchKind(index) {
  if (index % 16 === 0) return 'inch';
  if (index % 8 === 0) return 'half';
  if (index % 4 === 0) return 'quarter';
  if (index % 2 === 0) return 'eighth';
  return 'sixteenth';
}

function metricKind(mm) {
  if (mm % 10 === 0) return 'cm';
  return mm % 5 === 0 ? 'half' : 'mm';
}

// The ticks of a ruler `length` long, a whole number of inches (units 'in') or of millimetres (units 'mm').
// Each is { mm, kind, lengthMm, label? }: where it is and how long it is, in real mm, and for a whole inch or a
// centimetre the number to print beside it. Positions come from whole sixteenths or whole millimetres, so they
// stay exact.
export function rulerTicks(units, length) {
  const ticks = [];
  if (units === 'in') {
    for (let index = 0; index <= length * TICKS_PER_INCH; index++) {
      const kind = inchKind(index);
      const tick = { mm: (index / TICKS_PER_INCH) * MM_PER_INCH, kind, lengthMm: TICK_MM.in[kind] };
      if (kind === 'inch') tick.label = String(index / TICKS_PER_INCH);
      ticks.push(tick);
    }
  } else {
    for (let mm = 0; mm <= length; mm++) {
      const kind = metricKind(mm);
      const tick = { mm, kind, lengthMm: TICK_MM.mm[kind] };
      if (kind === 'cm') tick.label = String(mm / 10);
      ticks.push(tick);
    }
  }
  return ticks;
}

// The longest tick, for sizing the drawing
export const longestTickMm = units => (units === 'in' ? TICK_MM.in.inch : TICK_MM.mm.cm);
