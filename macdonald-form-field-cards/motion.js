// Maths for turning one ring of letters round the fixation point. No DOM access, so it can be tested.
// Angles are in radians, as the screen draws them: y points down, so a growing angle turns clockwise.

// Speed is in whole turns per minute.
export const SPEED = { min: 1, max: 30, default: 6 };

// The direction as it appears on screen, and the sign it gives to the angle
export const DIRECTIONS = { clockwise: 1, counterclockwise: -1 };

// A frame is never counted as longer than this, so a tab that was in the background does not make the
// ring jump when it comes back
export const MAX_FRAME_MS = 100;

const FULL_TURN = 2 * Math.PI;

// The turn after `dtMs` more milliseconds at `turnsPerMinute`, kept between 0 and a full turn.
export function advanceAngle(turn, dtMs, turnsPerMinute, direction) {
  const sign = DIRECTIONS[direction];
  if (sign === undefined) throw new RangeError(`unknown direction "${direction}"`);
  const dt = Math.min(Math.max(dtMs, 0), MAX_FRAME_MS);
  const next = turn + (sign * FULL_TURN * turnsPerMinute * dt) / 60000;
  return ((next % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

// How long one turn takes, in seconds.
export function secondsPerTurn(turnsPerMinute) {
  return 60 / turnsPerMinute;
}

// Where a letter goes when its ring has turned by `turn` radians about the centre (cx, cy). The letter keeps
// its own distance from the centre, and is placed, not rotated, so it stays upright.
// `letter` needs the `angle` and `r` that placeLetters returns.
export function turnedPosition({ angle, r }, turn, cx, cy) {
  return { x: cx + r * Math.cos(angle + turn), y: cy + r * Math.sin(angle + turn) };
}
