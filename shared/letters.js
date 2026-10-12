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

// Letters for several groups (the rings of a card) dealt from one pool, so a letter is not used a second
// time anywhere until every letter in the pool has been used once. `counts` is how many letters each group
// needs. A group never repeats a letter inside itself unless it needs more letters than the pool holds.
export function dealLetters(pool, counts, random = Math.random) {
  let bag = []; // letters not yet dealt in the current pass through the pool
  return counts.map(count => {
    const group = [];
    while (group.length < count) {
      if (bag.length === 0) {
        const fresh = pool.filter(letter => !group.includes(letter));
        bag = shuffle(fresh.length > 0 ? fresh : pool, random);
      }
      group.push(bag.pop());
    }
    return group;
  });
}
