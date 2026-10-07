import { describe, expect, it } from 'vitest';
import { UPPER, UPPER_CONSONANTS, VOWELS, pickLetters, shuffle } from '../shared/letters.js';
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
