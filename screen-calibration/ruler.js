// The tick marks of the check ruler, in real inches. No DOM access, so it can be tested.

// Ticks fall every 1/16 inch. Whole inches carry a label; the others get shorter the finer the division.
export const TICKS_PER_INCH = 16;

// Tick lengths in inches, so the ticks themselves are true to size once the screen is calibrated.
export const TICK_IN = { inch: 0.25, half: 0.19, quarter: 0.14, eighth: 0.1, sixteenth: 0.06 };

function tickKind(index) {
  if (index % 16 === 0) return 'inch';
  if (index % 8 === 0) return 'half';
  if (index % 4 === 0) return 'quarter';
  if (index % 2 === 0) return 'eighth';
  return 'sixteenth';
}

// One tick per sixteenth of an inch from 0 to `lengthIn` (a whole number of inches). Positions are in
// inches, worked out from whole sixteenths so they stay exact.
export function rulerTicks(lengthIn) {
  const ticks = [];
  for (let index = 0; index <= lengthIn * TICKS_PER_INCH; index++) {
    const kind = tickKind(index);
    const tick = { inches: index / TICKS_PER_INCH, kind, lengthIn: TICK_IN[kind] };
    if (kind === 'inch') tick.label = String(index / TICKS_PER_INCH);
    ticks.push(tick);
  }
  return ticks;
}
