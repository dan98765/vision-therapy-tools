import { describe, expect, it } from 'vitest';
import { TICK_MM, rulerTicks } from '../screen-calibration/ruler.js';

describe('rulerTicks', () => {
  const ticks = rulerTicks(150);

  it('has one tick per millimetre including both ends', () => {
    expect(ticks).toHaveLength(151);
    expect(ticks[0].mm).toBe(0);
    expect(ticks.at(-1).mm).toBe(150);
    expect(ticks.map(t => t.mm)).toEqual(Array.from({ length: 151 }, (_, i) => i));
  });

  it('labels each centimetre and nothing else', () => {
    const labelled = ticks.filter(t => t.label);
    expect(labelled.map(t => t.label)).toEqual(Array.from({ length: 16 }, (_, i) => String(i)));
    expect(labelled.every(t => t.mm % 10 === 0 && t.kind === 'cm')).toBe(true);
  });

  it('makes centimetre ticks longest, then half centimetres, then millimetres', () => {
    const lengthOf = kind => ticks.find(t => t.kind === kind).lengthMm;
    expect(lengthOf('cm')).toBe(TICK_MM.cm);
    expect(lengthOf('half')).toBe(TICK_MM.half);
    expect(lengthOf('mm')).toBe(TICK_MM.mm);
    expect(TICK_MM.cm).toBeGreaterThan(TICK_MM.half);
    expect(TICK_MM.half).toBeGreaterThan(TICK_MM.mm);
    expect(ticks.filter(t => t.kind === 'half')).toHaveLength(15); // 5, 15, ... 145
    expect(ticks.filter(t => t.kind === 'cm')).toHaveLength(16); // 0, 10, ... 150
  });

  it('copes with a length that is not a whole number of centimetres', () => {
    const short = rulerTicks(23);
    expect(short).toHaveLength(24);
    expect(short.filter(t => t.label).map(t => t.label)).toEqual(['0', '1', '2']);
  });
});
