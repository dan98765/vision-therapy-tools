import { describe, expect, it } from 'vitest';
import { UPPER, UPPER_CONSONANTS, VOWELS, dealLetters, pickLetters, shuffle } from '../shared/letters.js';
import { seeded } from './rng.js';

describe('letter sets', () => {
  it('have the expected sizes and no overlap between vowels and consonants', () => {
    expect(UPPER).toHaveLength(26);
    expect(UPPER_CONSONANTS).toHaveLength(21);
    expect(VOWELS).toHaveLength(5);
    expect(UPPER_CONSONANTS.some(c => VOWELS.includes(c))).toBe(false);
  });
});

describe('shuffle', () => {
  it('returns a permutation and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffle(input, seeded(1));
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('is repeatable with the same seed', () => {
    expect(shuffle(UPPER, seeded(7))).toEqual(shuffle(UPPER, seeded(7)));
  });
});

describe('pickLetters', () => {
  it('has no repeats when the count fits the pool', () => {
    for (let seed = 0; seed < 50; seed++) {
      const out = pickLetters(UPPER, 10, seeded(seed));
      expect(out).toHaveLength(10);
      expect(new Set(out).size).toBe(10);
    }
  });

  it('allows repeats only when asked for more than the pool holds', () => {
    const out = pickLetters(VOWELS, 12, seeded(3));
    expect(out).toHaveLength(12);
    expect(out.every(letter => VOWELS.includes(letter))).toBe(true);
  });
});

describe('dealLetters', () => {
  const counts = rings => Array(rings).fill(6);

  it('uses no letter twice when the places fit the pool', () => {
    for (let seed = 0; seed < 100; seed++) {
      const groups = dealLetters(UPPER, counts(4), seeded(seed)); // 24 places, 26 letters
      expect(groups.map(g => g.length)).toEqual([6, 6, 6, 6]);
      expect(new Set(groups.flat()).size).toBe(24);
    }
  });

  it('uses every letter exactly once when the places equal the pool', () => {
    for (let seed = 0; seed < 100; seed++) {
      const groups = dealLetters(UPPER, [13, 13], seeded(seed));
      expect([...groups.flat()].sort()).toEqual(UPPER);
    }
  });

  it('uses every letter before repeating any, and spreads repeats evenly', () => {
    for (let seed = 0; seed < 100; seed++) {
      const all = dealLetters(UPPER, counts(5), seeded(seed)).flat(); // 30 places, 26 letters
      const times = letter => all.filter(x => x === letter).length;
      expect(UPPER.every(letter => times(letter) >= 1 && times(letter) <= 2)).toBe(true);
      expect(UPPER.filter(letter => times(letter) === 2)).toHaveLength(4);
    }
  });

  it('never repeats a letter inside one group while the pool is big enough', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const group of dealLetters(UPPER, counts(7).map(() => 10), seeded(seed))) {
        expect(new Set(group).size).toBe(group.length); // 70 places over 26 letters
      }
    }
  });

  it('only uses letters from the pool, and copes with a pool smaller than a group', () => {
    const groups = dealLetters(VOWELS, counts(3), seeded(2)); // 18 places, 5 letters
    expect(groups.flat().every(letter => VOWELS.includes(letter))).toBe(true);
    expect(groups.flat()).toHaveLength(18);
  });

  it('is repeatable with the same seed and leaves the pool alone', () => {
    const pool = [...UPPER];
    expect(dealLetters(pool, counts(3), seeded(9))).toEqual(dealLetters(pool, counts(3), seeded(9)));
    expect(pool).toEqual(UPPER);
  });
});
