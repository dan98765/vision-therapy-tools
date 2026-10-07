import { describe, expect, it } from 'vitest';
import { CAP_HEIGHT, UPPER } from '../shared/letters.js';
import {
  BORDER_MM,
  cardGeometry,
  fitRings,
  layoutRings,
  outerExtent,
  placeLetters,
} from '../macdonald-form-field-cards/layout.js';
import { seeded } from './rng.js';

// Page defaults from macdonald-form-field-cards/index.html
const DEFAULTS = { longSide: 216, ratio: 0.647, rings: 5, perRing: 6, baseMm: 2, scale: 1.6 };

// The ink of a capital letter: as wide as the widest capital (W, 0.94 em) and as
// tall as a capital (CAP_HEIGHT), plus a small margin so letters never nearly touch.
const INK_MARGIN = 0.1;
const BOX_W = 0.94 + INK_MARGIN;
const BOX_H = CAP_HEIGHT + INK_MARGIN;

function build({ longSide, ratio, rings, perRing, baseMm, scale }, random = Math.random) {
  const geo = cardGeometry(longSide, ratio);
  const baseEm = baseMm / CAP_HEIGHT;
  const fit = fitRings(rings, perRing, baseEm, scale, geo.available);
  const letters = placeLetters(fit.rings, perRing, geo.cx, geo.cy, UPPER, random);
  return { geo, fit, letters };
}

function boxes(letters) {
  return letters.map(({ x, y, font }) => ({
    left: x - (BOX_W * font) / 2,
    right: x + (BOX_W * font) / 2,
    top: y - (BOX_H * font) / 2,
    bottom: y + (BOX_H * font) / 2,
  }));
}

describe('cardGeometry', () => {
  it('uses the long side for portrait and landscape cards', () => {
    const portrait = cardGeometry(216, 0.647);
    expect(portrait.height).toBe(216);
    expect(portrait.width).toBeCloseTo(139.75, 1);

    const landscape = cardGeometry(216, 1.545);
    expect(landscape.width).toBe(216);
    expect(landscape.height).toBeCloseTo(139.8, 1);
  });

  it('measures the centre from inside the border', () => {
    const geo = cardGeometry(200, 1);
    expect(geo.cx).toBeCloseTo((200 - 2 * BORDER_MM) / 2);
    expect(geo.cy).toBeCloseTo(geo.cx);
  });
});

describe('layoutRings', () => {
  it('grows letters by the scale factor each ring and moves rings outward', () => {
    const rings = layoutRings(5, 6, 2 / CAP_HEIGHT, 1.6, 1);
    for (let i = 1; i < rings.length; i++) {
      expect(rings[i].font / rings[i - 1].font).toBeCloseTo(1.6);
      expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
    }
  });
});

describe('fitRings', () => {
  it('does not shrink the default settings', () => {
    const { geo, fit } = build(DEFAULTS);
    expect(fit.k).toBe(1);
    expect(outerExtent(fit.rings)).toBeLessThanOrEqual(geo.available);
  });

  it('shrinks every letter by the same factor when the request does not fit', () => {
    const { geo, fit } = build({ ...DEFAULTS, scale: 2.5, rings: 7 });
    expect(fit.k).toBeLessThan(1);
    expect(outerExtent(fit.rings)).toBeLessThanOrEqual(geo.available + 1e-6);
    // The size progression is kept, so the scale factor between rings is unchanged.
    for (let i = 1; i < fit.rings.length; i++) {
      expect(fit.rings[i].font / fit.rings[i - 1].font).toBeCloseTo(2.5);
    }
  });
});

describe('placeLetters', () => {
  it('is repeatable with the same seed and places perRing letters per ring', () => {
    const a = build(DEFAULTS, seeded(5));
    const b = build(DEFAULTS, seeded(5));
    expect(a.letters).toEqual(b.letters);
    expect(a.letters).toHaveLength(DEFAULTS.rings * DEFAULTS.perRing);
  });

  // The same sweep that was first checked by hand in the browser: every combination
  // of settings must keep every letter inside the card and never overlap another.
  it('never clips or overlaps across the whole settings range', () => {
    let checked = 0;
    for (const longSide of [100, 216, 250]) {
      for (const ratio of [0.647, 0.75, 1, 1.333, 1.545]) {
        for (const rings of [3, 5, 7]) {
          for (const perRing of [3, 6, 10]) {
            for (const baseMm of [1, 6]) {
              for (const scale of [1.3, 2.5]) {
                for (const seed of [1, 2]) {
                  const settings = { longSide, ratio, rings, perRing, baseMm, scale };
                  const { geo, letters } = build(settings, seeded(seed));
                  const bs = boxes(letters);
                  const label = JSON.stringify({ ...settings, seed });

                  for (const b of bs) {
                    if (b.left < 0 || b.top < 0 || b.right > 2 * geo.cx || b.bottom > 2 * geo.cy) {
                      expect.fail(`clipped: ${label}`);
                    }
                  }
                  for (let i = 0; i < bs.length; i++) {
                    for (let j = i + 1; j < bs.length; j++) {
                      const p = bs[i];
                      const q = bs[j];
                      if (p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom) {
                        expect.fail(`overlap: ${label}`);
                      }
                    }
                  }
                  checked++;
                }
              }
            }
          }
        }
      }
    }
    expect(checked).toBe(3 * 5 * 3 * 3 * 2 * 2 * 2);
  });
});
