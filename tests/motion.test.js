import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAP_HEIGHT, UPPER } from '../shared/letters.js';
import { cardGeometry, fitRings, placeLetters } from '../macdonald-form-field-cards/layout.js';
import {
  DIRECTIONS,
  MAX_FRAME_MS,
  SPEED,
  advanceAngle,
  secondsPerTurn,
  turnedPosition,
} from '../macdonald-form-field-cards/motion.js';
import { seeded } from './rng.js';

const TAU = 2 * Math.PI;

// Run the ring for `seconds` in frames of `frameMs`, the way the page does
function run(seconds, turnsPerMinute, direction, frameMs = 16) {
  let turn = 0;
  for (let t = 0; t < seconds * 1000; t += frameMs) turn = advanceAngle(turn, frameMs, turnsPerMinute, direction);
  return turn;
}

describe('advanceAngle', () => {
  it('turns clockwise as the screen draws it: a quarter turn in a quarter of the time', () => {
    // 6 turns a minute is 10 s a turn, so 2.5 s is a quarter turn
    expect(run(2.5, 6, 'clockwise', 10)).toBeCloseTo(TAU / 4, 8);
  });

  it('turns the other way for counterclockwise', () => {
    expect(run(2.5, 6, 'counterclockwise', 10)).toBeCloseTo(TAU - TAU / 4, 8);
  });

  it('is back where it started after one full turn, in either direction', () => {
    for (const direction of Object.keys(DIRECTIONS)) {
      const turn = run(10, 6, direction, 10);
      expect(Math.min(turn, TAU - turn)).toBeLessThan(1e-8);
    }
  });

  it('goes faster at a higher speed, in proportion', () => {
    expect(run(1, 12, 'clockwise', 10)).toBeCloseTo(2 * run(1, 6, 'clockwise', 10), 8);
    expect(run(1, SPEED.max, 'clockwise', 10)).toBeCloseTo(SPEED.max * run(1, SPEED.min, 'clockwise', 10), 8);
  });

  it('stays between 0 and one full turn however long it runs', () => {
    for (const direction of Object.keys(DIRECTIONS)) {
      let turn = 0;
      for (let i = 0; i < 5000; i++) {
        turn = advanceAngle(turn, 16, SPEED.max, direction);
        expect(turn).toBeGreaterThanOrEqual(0);
        expect(turn).toBeLessThan(TAU);
      }
    }
  });

  it('counts a long gap between frames as one short frame, so the ring does not jump', () => {
    const jump = advanceAngle(0, 60_000, 6, 'clockwise'); // a tab left in the background for a minute
    expect(jump).toBeCloseTo(advanceAngle(0, MAX_FRAME_MS, 6, 'clockwise'), 12);
    expect(jump).toBeLessThan(0.1);
  });

  it('ignores a negative gap and rejects an unknown direction', () => {
    expect(advanceAngle(1, -50, 6, 'clockwise')).toBe(1);
    expect(() => advanceAngle(0, 16, 6, 'sideways')).toThrow(RangeError);
  });
});

describe('secondsPerTurn', () => {
  it('is sixty divided by the turns a minute', () => {
    expect(secondsPerTurn(6)).toBe(10);
    expect(secondsPerTurn(30)).toBe(2);
  });
});

describe('turnedPosition', () => {
  const letter = { angle: 0.7, r: 40 };
  const cx = 70;
  const cy = 100;

  it('puts a letter where it was drawn when the ring has not turned', () => {
    const { x, y } = turnedPosition(letter, 0, cx, cy);
    expect(x).toBeCloseTo(cx + 40 * Math.cos(0.7), 10);
    expect(y).toBeCloseTo(cy + 40 * Math.sin(0.7), 10);
  });

  it('keeps the same distance from the center at every turn', () => {
    for (let turn = 0; turn < TAU; turn += 0.37) {
      const { x, y } = turnedPosition(letter, turn, cx, cy);
      expect(Math.hypot(x - cx, y - cy)).toBeCloseTo(40, 9);
    }
  });

  it('comes back after a full turn and moves a quarter of the way round after a quarter', () => {
    const full = turnedPosition(letter, TAU, cx, cy);
    const home = turnedPosition(letter, 0, cx, cy);
    expect(full.x).toBeCloseTo(home.x, 9);
    expect(full.y).toBeCloseTo(home.y, 9);
    const quarter = turnedPosition({ angle: 0, r: 10 }, TAU / 4, 0, 0); // right of centre moves to below (y points down)
    expect(quarter.x).toBeCloseTo(0, 9);
    expect(quarter.y).toBeCloseTo(10, 9);
  });
});

describe('the placed letters carry what a ring needs to turn', () => {
  it('returns the ring, angle and distance of every letter, matching its x and y', () => {
    const geo = cardGeometry(216, 0.647);
    const fit = fitRings(5, 6, 2 / CAP_HEIGHT, 1.6, geo.available);
    const letters = placeLetters(fit.rings, 6, geo.cx, geo.cy, UPPER, seeded(3));
    expect(new Set(letters.map(l => l.ring))).toEqual(new Set([0, 1, 2, 3, 4]));
    for (const l of letters) {
      const { x, y } = turnedPosition(l, 0, geo.cx, geo.cy);
      expect(x).toBeCloseTo(l.x, 9);
      expect(y).toBeCloseTo(l.y, 9);
    }
  });
});

// A letter's ink box (as in cards-layout.test.js, but with a smaller margin). The card is laid out so still
// letters keep 0.1 em apart; a turning ring passes its neighbours at an angle that layout did not plan for,
// and keeps at least this much clear of them (measured at about 0.065 em at worst, so the ink never touches).
const INK_MARGIN = 0.05;
const BOX_W = 0.94 + INK_MARGIN;
const BOX_H = CAP_HEIGHT + INK_MARGIN;
const box = (x, y, font) => ({
  left: x - (BOX_W * font) / 2,
  right: x + (BOX_W * font) / 2,
  top: y - (BOX_H * font) / 2,
  bottom: y + (BOX_H * font) / 2,
});

describe('turning one ring', () => {
  it('never overlaps another letter or leaves the card, at any angle', () => {
    let checked = 0;
    for (const [longSide, ratio] of [[100, 1], [216, 0.647], [250, 1], [216, 1.545]]) {
      for (const [rings, perRing] of [[3, 3], [5, 6], [7, 10]]) {
        for (const [baseMm, scale] of [[1, 1.3], [2, 1.6], [4, 2.5]]) {
          const geo = cardGeometry(longSide, ratio);
          const fit = fitRings(rings, perRing, baseMm / CAP_HEIGHT, scale, geo.available);
          const letters = placeLetters(fit.rings, perRing, geo.cx, geo.cy, UPPER, seeded(rings * 31 + perRing));
          for (let moving = 0; moving < rings; moving++) {
            for (let step = 0; step < 24; step++) {
              const turn = (step / 24) * TAU;
              const boxes = letters.map(l => {
                const { x, y } = l.ring === moving ? turnedPosition(l, turn, geo.cx, geo.cy) : l;
                return { ring: l.ring, ...box(x, y, l.font) };
              });
              const label = JSON.stringify({ longSide, ratio, rings, perRing, baseMm, scale, moving, step });
              for (const b of boxes) {
                if (b.left < 0 || b.top < 0 || b.right > 2 * geo.cx || b.bottom > 2 * geo.cy) expect.fail(`clipped: ${label}`);
              }
              for (let i = 0; i < boxes.length; i++) {
                for (let j = i + 1; j < boxes.length; j++) {
                  const p = boxes[i];
                  const q = boxes[j];
                  if (p.ring !== moving && q.ring !== moving) continue; // still letters were already checked
                  if (p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom) expect.fail(`overlap: ${label}`);
                }
              }
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});

// The page repeats the speed range and the direction choices. Check they agree with the maths.
describe('the page and the motion maths agree', () => {
  const html = readFileSync(join(resolve(import.meta.dirname, '..'), 'macdonald-form-field-cards', 'index.html'), 'utf8');
  const attribute = (id, name) => html.match(new RegExp(`id="${id}"[^>]*\\s${name}="([^"]*)"`))?.[1];

  it('has the same speed range and default', () => {
    expect(Number(attribute('ring-speed', 'min'))).toBe(SPEED.min);
    expect(Number(attribute('ring-speed', 'max'))).toBe(SPEED.max);
    expect(Number(attribute('ring-speed', 'value'))).toBe(SPEED.default);
  });

  it('offers exactly the directions the maths knows, clockwise first', () => {
    const select = html.match(/<select id="ring-direction">([\s\S]*?)<\/select>/)[1];
    const values = [...select.matchAll(/<option value="(\w+)"/g)].map(m => m[1]);
    expect(values).toEqual(Object.keys(DIRECTIONS));
    expect(select).toMatch(/<option value="clockwise" selected>/);
  });

  it('starts with no moving ring and the start button disabled', () => {
    expect(html).toMatch(/<option value="" selected>None/);
    expect(html).toMatch(/id="btn-motion" disabled/);
  });
});
