import { describe, expect, it } from 'vitest';
import { TICKS_PER_INCH, TICK_IN, rulerTicks } from '../screen-calibration/ruler.js';

describe('rulerTicks', () => {
  const ticks = rulerTicks(6);

  it('has one tick per sixteenth of an inch including both ends', () => {
    expect(TICKS_PER_INCH).toBe(16);
    expect(ticks).toHaveLength(6 * 16 + 1);
    expect(ticks[0].inches).toBe(0);
    expect(ticks.at(-1).inches).toBe(6);
    expect(ticks.map(t => t.inches)).toEqual(Array.from({ length: 97 }, (_, i) => i / 16));
  });

  it('labels each whole inch and nothing else', () => {
    const labelled = ticks.filter(t => t.label);
    expect(labelled.map(t => t.label)).toEqual(['0', '1', '2', '3', '4', '5', '6']);
    expect(labelled.every(t => Number.isInteger(t.inches) && t.kind === 'inch')).toBe(true);
  });

  it('makes finer divisions shorter', () => {
    const lengthOf = kind => ticks.find(t => t.kind === kind).lengthIn;
    expect(lengthOf('inch')).toBe(TICK_IN.inch);
    expect(lengthOf('sixteenth')).toBe(TICK_IN.sixteenth);
    const order = ['inch', 'half', 'quarter', 'eighth', 'sixteenth'].map(k => TICK_IN[k]);
    expect(order).toEqual([...order].sort((a, b) => b - a));
    expect(new Set(order).size).toBe(5);
  });

  it('counts each kind', () => {
    const count = kind => ticks.filter(t => t.kind === kind).length;
    expect(count('inch')).toBe(7); // 0 to 6
    expect(count('half')).toBe(6); // 1/2, 1 1/2, ... 5 1/2
    expect(count('quarter')).toBe(12);
    expect(count('eighth')).toBe(24);
    expect(count('sixteenth')).toBe(48);
  });

  it('copes with a short ruler', () => {
    expect(rulerTicks(1)).toHaveLength(17);
    expect(rulerTicks(2).filter(t => t.label).map(t => t.label)).toEqual(['0', '1', '2']);
  });
});
