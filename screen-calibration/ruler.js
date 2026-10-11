// The tick marks of the check ruler, in real millimetres. No DOM access, so it can be tested.

// Tick lengths in mm, so the ticks themselves are true to size once the screen is calibrated.
export const TICK_MM = { mm: 2, half: 3.5, cm: 5 };

// One tick per millimetre from 0 to `lengthMm`. Every 10 mm is a centimetre tick with a label,
// every 5 mm a half-centimetre tick, and the rest plain.
export function rulerTicks(lengthMm) {
  const ticks = [];
  for (let mm = 0; mm <= lengthMm; mm++) {
    if (mm % 10 === 0) ticks.push({ mm, kind: 'cm', lengthMm: TICK_MM.cm, label: String(mm / 10) });
    else if (mm % 5 === 0) ticks.push({ mm, kind: 'half', lengthMm: TICK_MM.half });
    else ticks.push({ mm, kind: 'mm', lengthMm: TICK_MM.mm });
  }
  return ticks;
}
