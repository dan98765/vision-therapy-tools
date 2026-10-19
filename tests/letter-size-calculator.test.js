import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ANGLE_LIMITS_ARCMIN,
  ANGLE_UNITS,
  ARCMIN_PER_DEGREE,
  angleFor,
  angleFromArcmin,
  angleToArcmin,
  convertAngle,
  distanceFor,
  heightFor,
  restoredAngleArcmin,
  solve,
} from '../letter-size-calculator/angle.js';
import { LENGTH_CONTROLS } from '../letter-size-calculator/lengths.js';
import { REMEMBERED } from '../letter-size-calculator/remembered.js';
import { PREFILL_PAGES } from '../shared/prefill.js';

describe('the three formulas', () => {
  it('gives the textbook height: 5 minutes of arc at 1 metre is about 1.454 mm', () => {
    expect(heightFor(1000, 5)).toBeCloseTo(1.4544, 3);
  });

  it('gives the height for the defaults: 30 minutes of arc at 16 in is about 0.14 in', () => {
    expect(heightFor(16, 30)).toBeCloseTo(0.1396, 3);
  });

  it('works the angle back from a height and a distance', () => {
    expect(angleFor(1.4544, 1000)).toBeCloseTo(5, 3);
    expect(angleFor(0.1396, 16)).toBeCloseTo(30, 1); // the height is given to four decimals
  });

  it('works the distance back from a height and an angle', () => {
    expect(distanceFor(1.4544, 5)).toBeCloseTo(1000, 0);
  });

  it('round-trips through all three, over a wide range of sizes and angles', () => {
    for (const distance of [4, 16, 120, 600, 15000]) {
      for (const angle of [0.5, 1, 5, 30, 120, 600]) {
        const height = heightFor(distance, angle);
        expect(angleFor(height, distance), `${distance}, ${angle}`).toBeCloseTo(angle, 8);
        expect(distanceFor(height, angle) / distance, `${distance}, ${angle}`).toBeCloseTo(1, 10);
      }
    }
  });

  it('is in proportion for small angles: twice the distance, twice the height', () => {
    expect(heightFor(200, 10) / heightFor(100, 10)).toBeCloseTo(2, 10);
    expect(heightFor(100, 20) / heightFor(100, 10)).toBeCloseTo(2, 3);
  });

  it('refuses sizes and angles that cannot be real', () => {
    for (const bad of [0, -1, NaN, Infinity, undefined, null, '5']) {
      expect(() => heightFor(bad, 5), String(bad)).toThrow(RangeError);
      expect(() => heightFor(10, bad), String(bad)).toThrow(RangeError);
      expect(() => angleFor(bad, 10), String(bad)).toThrow(RangeError);
      expect(() => angleFor(1, bad), String(bad)).toThrow(RangeError);
      expect(() => distanceFor(bad, 5), String(bad)).toThrow(RangeError);
      expect(() => distanceFor(1, bad), String(bad)).toThrow(RangeError);
    }
  });
});

describe('solve', () => {
  const given = { height: 1.4544, distance: 1000, angleArcmin: 5 };

  it('works out each quantity and leaves the other two as they were', () => {
    const height = solve('height', given);
    expect(height.height).toBeCloseTo(1.4544, 3);
    expect([height.distance, height.angleArcmin]).toEqual([1000, 5]);

    const distance = solve('distance', given);
    expect(distance.distance).toBeCloseTo(1000, 0);
    expect([distance.height, distance.angleArcmin]).toEqual([1.4544, 5]);

    const angle = solve('angle', given);
    expect(angle.angleArcmin).toBeCloseTo(5, 3);
    expect([angle.height, angle.distance]).toEqual([1.4544, 1000]);
  });

  it('needs the two it is given, and knows only three things to work out', () => {
    expect(() => solve('height', { distance: 10, angleArcmin: 0 })).toThrow(RangeError);
    expect(() => solve('angle', { height: 1 })).toThrow(RangeError);
    expect(() => solve('weight', given)).toThrow(RangeError);
  });
});

describe('angle units', () => {
  it('has 60 minutes of arc to the degree and converts both ways', () => {
    expect(ARCMIN_PER_DEGREE).toBe(60);
    expect(angleToArcmin(1, 'deg')).toBe(60);
    expect(angleToArcmin(30, 'arcmin')).toBe(30);
    expect(angleFromArcmin(30, 'deg')).toBe(0.5);
    expect(angleFromArcmin(30, 'arcmin')).toBe(30);
  });

  it('converts a shown angle to the other unit, to that unit\'s decimals', () => {
    expect(convertAngle(30, 'arcmin', 'deg')).toBe(0.5);
    expect(convertAngle(0.5, 'deg', 'arcmin')).toBe(30);
    expect(convertAngle(7, 'arcmin', 'deg')).toBe(0.1167);
    expect(convertAngle(0.1167, 'deg', 'arcmin')).toBe(7);
  });

  it('settles after switching back and forth, never drifting', () => {
    let value = 7;
    for (let i = 0; i < 20; i++) value = convertAngle(convertAngle(value, 'arcmin', 'deg'), 'deg', 'arcmin');
    expect(value).toBe(7);
  });

  it('has the same range and default whichever way the angle is written, within rounding', () => {
    const { arcmin, deg } = ANGLE_UNITS;
    expect(arcmin.value).toBe(30);
    expect(angleToArcmin(deg.value, 'deg')).toBe(arcmin.value);
    expect(angleToArcmin(deg.max, 'deg')).toBe(arcmin.max);
    expect(angleToArcmin(deg.min, 'deg')).toBeGreaterThanOrEqual(arcmin.min);
    expect(ANGLE_LIMITS_ARCMIN).toEqual({ min: arcmin.min, max: arcmin.max });
  });
});

describe('restoredAngleArcmin', () => {
  it('accepts an angle inside the limits, ends included', () => {
    for (const ok of [0.5, 30, 600]) expect(restoredAngleArcmin(ok)).toBe(ok);
  });

  it('ignores anything else', () => {
    for (const bad of [0.4, 601, 0, -5, NaN, Infinity, '30', null, undefined, {}, [30]]) {
      expect(restoredAngleArcmin(bad), String(bad)).toBeNull();
    }
  });
});

// The page repeats the choices, the angle's range and the lengths' starting values. Check they agree.
describe('the page and the calculator maths agree', () => {
  const html = readFileSync(join(resolve(import.meta.dirname, '..'), 'letter-size-calculator', 'index.html'), 'utf8');
  const attribute = (id, name) => html.match(new RegExp(`id="${id}"[^>]*\\s${name}="([^"]*)"`))?.[1];
  const options = id => [...html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`))[1].matchAll(/<option value="(\w+)"/g)].map(m => m[1]);

  it('offers to work out exactly the three quantities, starting with the height', () => {
    expect(options('solve-for')).toEqual(['height', 'distance', 'angle']);
    expect(html).toMatch(/<option value="height" selected>/);
  });

  it('offers exactly the angle units the maths knows, starting with minutes of arc', () => {
    expect(options('angle-unit')).toEqual(Object.keys(ANGLE_UNITS));
    expect(html).toMatch(/<option value="arcmin" selected>/);
  });

  it('starts the angle box as the minutes-of-arc definition says', () => {
    const { min, max, step, value } = ANGLE_UNITS.arcmin;
    expect([attribute('visual-angle', 'min'), attribute('visual-angle', 'max'), attribute('visual-angle', 'step'), attribute('visual-angle', 'value')].map(Number)).toEqual([min, max, step, value]);
  });

  it('starts the length boxes as their inch definitions say', () => {
    for (const [id, spec] of Object.entries(LENGTH_CONTROLS)) {
      for (const name of ['min', 'max', 'step', 'value']) expect(Number(attribute(id, name)), `${id} ${name}`).toBe(spec.in[name]);
    }
  });

  it('starts with the answer box, and only that one, locked, matching the first choice', () => {
    expect(html).toMatch(/id="letter-height"[^>]*\sreadonly/);
    expect(html).not.toMatch(/id="viewing-distance"[^>]*\sreadonly/);
    expect(html).not.toMatch(/id="visual-angle"[^>]*\sreadonly/);
  });

  it('has a link, hidden until there is an answer, to every page that takes a letter height', () => {
    expect(html).toMatch(/id="use-panel" hidden/);
    for (const folder of PREFILL_PAGES) expect(html).toContain(`id="link-${folder}" href="../${folder}/"`);
  });

  it('remembers the choices and the length boxes, but not the angle (which is kept in minutes of arc)', () => {
    expect(REMEMBERED).toEqual(['solve-for', 'angle-unit', 'letter-height', 'viewing-distance']);
    expect(REMEMBERED).not.toContain('visual-angle');
    for (const id of Object.keys(LENGTH_CONTROLS)) expect(REMEMBERED).toContain(id);
  });
});
