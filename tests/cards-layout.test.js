import { describe, expect, it } from 'vitest';
import { CAP_HEIGHT, UPPER, UPPER_CONSONANTS, VOWELS } from '../shared/letters.js';
import {
  BORDER_MM,
  cardGeometry,
  fitRings,
  layoutRings,
  outerExtent,
  placeLetters,
  ringCounts,
} from '../macdonald-form-field-cards/layout.js';
import { inkBox, layoutProblem } from './ink.js';
import { seeded } from './rng.js';

// Page defaults from macdonald-form-field-cards/index.html
const DEFAULTS = { longSide: 216, ratio: 0.647, rings: 5, perRing: 6, baseMm: 2, scale: 1.6 };

// Still letters keep this much clear of each other, in em (see tests/ink.js)
const INK_MARGIN = 0.1;

function build({ longSide, ratio, rings, perRing, baseMm, scale }, random = Math.random) {
  const geo = cardGeometry(longSide, ratio);
  const baseEm = baseMm / CAP_HEIGHT;
  const fit = fitRings(rings, perRing, baseEm, scale, geo.available);
  const letters = placeLetters(fit.rings, perRing, geo.cx, geo.cy, UPPER, random);
  return { geo, fit, letters };
}

const boxes = letters => letters.map(({ x, y, font }) => inkBox(x, y, font, INK_MARGIN));

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
                  const problem = layoutProblem(boxes(letters), geo);
                  if (problem) expect.fail(`${problem}: ${JSON.stringify({ ...settings, seed })}`);
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

describe('placeLetters without repeats', () => {
  function place(settings, random, noRepeats) {
    const geo = cardGeometry(settings.longSide, settings.ratio);
    const fit = fitRings(settings.rings, settings.perRing, settings.baseMm / CAP_HEIGHT, settings.scale, geo.available);
    return placeLetters(fit.rings, settings.perRing, geo.cx, geo.cy, UPPER, random, { noRepeats });
  }

  it('shows no letter twice anywhere on a card that fits the alphabet', () => {
    for (let seed = 0; seed < 50; seed++) {
      const letters = place({ ...DEFAULTS, rings: 4, perRing: 6 }, seeded(seed), true); // 24 places
      expect(new Set(letters.map(l => l.letter)).size).toBe(24);
    }
  });

  it('shows all 26 letters once on a card of 26 places', () => {
    const letters = place({ ...DEFAULTS, rings: 2, perRing: 13 }, seeded(4), true);
    expect(letters).toHaveLength(26);
    expect(letters.map(l => l.letter).sort()).toEqual(UPPER);
  });

  it('repeats only after every letter is used when the card has more places than letters', () => {
    const letters = place(DEFAULTS, seeded(8), true).map(l => l.letter); // 30 places
    expect(new Set(letters).size).toBe(26);
  });

  it('puts the same letters in the same places when repeats are allowed, as before', () => {
    const a = place(DEFAULTS, seeded(3), false);
    expect(a).toEqual(build(DEFAULTS, seeded(3)).letters);
  });

  it('keeps the same positions and sizes either way, so the layout checks still apply', () => {
    const geometry = letters => letters.map(({ font }) => font);
    expect(geometry(place(DEFAULTS, seeded(6), true))).toEqual(geometry(place(DEFAULTS, seeded(6), false)));
  });
});

describe('layoutRings with a count for each ring', () => {
  it('uses each ring\'s own count, so a ring with more letters is pushed further out', () => {
    const even = layoutRings(2, [6, 6], 2 / CAP_HEIGHT, 1.6, 1);
    const crowded = layoutRings(2, [6, 30], 2 / CAP_HEIGHT, 1.6, 1);
    expect(crowded[1].radius).toBeGreaterThan(even[1].radius);
    expect(crowded[0]).toEqual(even[0]);
  });

  it('copes with a ring of one letter, which has no neighbours to keep clear of', () => {
    const rings = layoutRings(3, [1, 4, 6], 2 / CAP_HEIGHT, 1.6, 1);
    for (const ring of rings) expect(Number.isFinite(ring.radius)).toBe(true);
    expect(rings[0].radius).toBeGreaterThan(0);
    expect(rings[1].radius).toBeGreaterThan(rings[0].radius);
  });
});

describe('ringCounts', () => {
  it('adds up to the total with at most one letter between rings, the extra ones on the outside', () => {
    for (const total of [5, 9, 21, 26]) {
      for (const rings of [3, 4, 5, 6, 7]) {
        const counts = ringCounts(total, rings);
        expect(counts.reduce((a, b) => a + b, 0), `${total} over ${rings}`).toBe(total);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
        expect(counts).toEqual([...counts].sort((a, b) => a - b));
      }
    }
  });

  it('spreads the alphabet over five rings as 5, 5, 5, 5, 6', () => {
    expect(ringCounts(26, 5)).toEqual([5, 5, 5, 5, 6]);
    expect(ringCounts(26, 7)).toEqual([3, 3, 4, 4, 4, 4, 4]);
  });

  it('never gives a ring fewer than three letters, using fewer rings for a small set', () => {
    expect(ringCounts(5, 3)).toEqual([5]); // five vowels
    expect(ringCounts(9, 7)).toEqual([3, 3, 3]);
    for (const total of [5, 8, 9, 21, 26]) {
      for (const rings of [3, 5, 7]) {
        const counts = ringCounts(total, rings);
        expect(Math.min(...counts)).toBeGreaterThanOrEqual(3);
        expect(counts.length).toBeLessThanOrEqual(rings);
      }
    }
  });
});

describe('every letter once, spread over uneven rings', () => {
  function placeAll(pool, rings, longSide, ratio, baseMm, scale, seed) {
    const counts = ringCounts(pool.length, rings);
    const geo = cardGeometry(longSide, ratio);
    const fit = fitRings(counts.length, counts, baseMm / CAP_HEIGHT, scale, geo.available);
    const letters = placeLetters(fit.rings, counts, geo.cx, geo.cy, pool, seeded(seed), { noRepeats: true });
    return { geo, counts, letters };
  }

  it('shows each letter of the set exactly once, with the counts per ring', () => {
    for (const pool of [UPPER, UPPER_CONSONANTS, VOWELS]) {
      for (const rings of [3, 5, 7]) {
        const { letters, counts } = placeAll(pool, rings, 216, 0.647, 2, 1.6, 7);
        expect(letters.map(l => l.letter).sort()).toEqual([...pool].sort());
        expect(letters).toHaveLength(counts.reduce((a, b) => a + b, 0));
      }
    }
  });

  it('never clips or overlaps across card sizes, shapes, rings and sets', () => {
    let checked = 0;
    for (const pool of [UPPER, UPPER_CONSONANTS, VOWELS]) {
      for (const longSide of [100, 216, 250]) {
        for (const ratio of [0.647, 1, 1.545]) {
          for (const rings of [3, 5, 7]) {
            for (const [baseMm, scale] of [[1, 1.3], [2, 1.6], [6, 2.5]]) {
              for (const seed of [1, 2]) {
                const { geo, letters } = placeAll(pool, rings, longSide, ratio, baseMm, scale, seed);
                const problem = layoutProblem(boxes(letters), geo);
                if (problem) expect.fail(`${problem}: ${JSON.stringify({ pool: pool.length, longSide, ratio, rings, baseMm, scale, seed })}`);
                checked++;
              }
            }
          }
        }
      }
    }
    expect(checked).toBe(3 * 3 * 3 * 3 * 3 * 2);
  });
});
