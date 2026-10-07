// Letter pools and helpers shared by the letter-based exercises.
// All functions take an optional `random` (like Math.random) so tests can be repeatable.

// Arial cap height as a fraction of font-size. Letter sizes in the UI are cap heights in mm.
export const CAP_HEIGHT = 0.716;

// Below this cap height (mm) letters may be too small to read, so pages warn.
export const MIN_LETTER_MM = 1.5;

export const UPPER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const UPPER_CONSONANTS = [...'BCDFGHJKLMNPQRSTVWXYZ'];
export const VOWELS = [...'AEIOU'];

export function shuffle(arr, random = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// `count` letters from `pool`, without repeats unless `count` exceeds the pool size.
export function pickLetters(pool, count, random = Math.random) {
  if (count <= pool.length) {
    return shuffle(pool, random).slice(0, count);
  }
  const result = [];
  while (result.length < count) {
    result.push(...shuffle(pool, random));
  }
  return result.slice(0, count);
}
