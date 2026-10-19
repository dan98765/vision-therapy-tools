import { describe, expect, it } from 'vitest';
import { TICKS_PER_INCH, TICK_MM, longestTickMm, rulerTicks } from '../screen-calibration/ruler.js';
import { MM_PER_INCH } from '../shared/units.js';

const count = (ticks, kind) => ticks.filter(t => t.kind === kind).length;

describe('an inch ruler', () => {
  const ticks = rulerTicks('in', 6);

  it('has one tick per sixteenth of an inch including both ends, positioned in real millimetres', () => {
    expect(TICKS_PER_INCH).toBe(16);
    expect(ticks).toHaveLength(6 * 16 + 1);
    expect(ticks[0].mm).toBe(0);
    expect(ticks.at(-1).mm).toBeCloseTo(6 * MM_PER_INCH, 10);
    ticks.forEach((tick, i) => expect(tick.mm).toBeCloseTo((i / 16) * MM_PER_INCH, 10));
  });

  it('labels each whole inch and nothing else', () => {
    const labelled = ticks.filter(t => t.label);
    expect(labelled.map(t => t.label)).toEqual(['0', '1', '2', '3', '4', '5', '6']);
    expect(labelled.every(t => t.kind === 'inch')).toBe(true);
  });

  it('makes finer divisions shorter', () => {
    const lengthOf = kind => ticks.find(t => t.kind === kind).lengthMm;
    const order = ['inch', 'half', 'quarter', 'eighth', 'sixteenth'].map(lengthOf);
    for (const kind of Object.keys(TICK_MM.in)) expect(lengthOf(kind)).toBe(TICK_MM.in[kind]);
    expect(order).toEqual([...order].sort((a, b) => b - a));
    expect(new Set(order).size).toBe(5);
  });

  it('counts each kind', () => {
    expect(count(ticks, 'inch')).toBe(7); // 0 to 6
    expect(count(ticks, 'half')).toBe(6); // 1/2, 1 1/2, ... 5 1/2
    expect(count(ticks, 'quarter')).toBe(12);
    expect(count(ticks, 'eighth')).toBe(24);
    expect(count(ticks, 'sixteenth')).toBe(48);
  });

  it('copes with a short ruler', () => {
    expect(rulerTicks('in', 1)).toHaveLength(17);
    expect(rulerTicks('in', 2).filter(t => t.label).map(t => t.label)).toEqual(['0', '1', '2']);
  });
});

describe('a metric ruler', () => {
  const ticks = rulerTicks('mm', 150);

  it('has one tick per millimetre including both ends', () => {
    expect(ticks).toHaveLength(151);
    expect(ticks.map(t => t.mm)).toEqual(Array.from({ length: 151 }, (_, i) => i));
  });

  it('labels each centimetre and nothing else', () => {
    const labelled = ticks.filter(t => t.label);
    expect(labelled.map(t => t.label)).toEqual(Array.from({ length: 16 }, (_, i) => String(i)));
    expect(labelled.every(t => t.mm % 10 === 0 && t.kind === 'cm')).toBe(true);
  });

  it('makes centimetre ticks longest, then half centimetres, then millimetres', () => {
    const lengthOf = kind => ticks.find(t => t.kind === kind).lengthMm;
    expect(lengthOf('cm')).toBe(TICK_MM.mm.cm);
    expect(lengthOf('half')).toBe(TICK_MM.mm.half);
    expect(lengthOf('mm')).toBe(TICK_MM.mm.mm);
    expect(TICK_MM.mm.cm).toBeGreaterThan(TICK_MM.mm.half);
    expect(TICK_MM.mm.half).toBeGreaterThan(TICK_MM.mm.mm);
    expect(count(ticks, 'half')).toBe(15); // 5, 15, ... 145
    expect(count(ticks, 'cm')).toBe(16); // 0, 10, ... 150
  });

  it('copes with a length that is not a whole number of centimetres', () => {
    const short = rulerTicks('mm', 23);
    expect(short).toHaveLength(24);
    expect(short.filter(t => t.label).map(t => t.label)).toEqual(['0', '1', '2']);
  });
});

describe('longestTickMm', () => {
  it('is the whole-inch tick or the centimetre tick', () => {
    expect(longestTickMm('in')).toBe(TICK_MM.in.inch);
    expect(longestTickMm('mm')).toBe(TICK_MM.mm.cm);
  });
});
