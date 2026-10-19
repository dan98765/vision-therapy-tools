// Maths for the letter-size calculator: how tall a letter must be to span a given visual angle at a given
// viewing distance, and the two rearrangements. No DOM access, so it can be tested.
//
// A letter of height h seen from distance d spans the angle  angle = 2 x atan(h / (2d)),  so
//   h = 2 x d x tan(angle / 2)   and   d = h / (2 x tan(angle / 2)).
// The height is the cap height, as everywhere on this site. The results are plain lengths and angles; they
// are not acuity ratings and say nothing about anyone's vision.

export const ARCMIN_PER_DEGREE = 60;

// The angles the calculator accepts, in minutes of arc: from half a minute to ten degrees. `digits` is how
// many decimals to show, and `value` the default, in each way of writing an angle.
export const ANGLE_UNITS = {
  arcmin: { name: 'minutes of arc', min: 0.5, max: 600, step: 0.5, value: 30, digits: 2 },
  deg: { name: 'degrees', min: 0.01, max: 10, step: 0.01, value: 0.5, digits: 4 },
};

export const ANGLE_LIMITS_ARCMIN = { min: ANGLE_UNITS.arcmin.min, max: ANGLE_UNITS.arcmin.max };

const toRadians = arcmin => (arcmin / ARCMIN_PER_DEGREE) * (Math.PI / 180);
const toArcmin = radians => (radians * 180 * ARCMIN_PER_DEGREE) / Math.PI;

// An angle written in `unit` ('arcmin' or 'deg') as minutes of arc, and back
export const angleToArcmin = (value, unit) => (unit === 'deg' ? value * ARCMIN_PER_DEGREE : value);
export const angleFromArcmin = (arcmin, unit) => (unit === 'deg' ? arcmin / ARCMIN_PER_DEGREE : arcmin);

// An angle shown in another unit, rounded to that unit's decimals so it stays readable
export function convertAngle(value, fromUnit, toUnit) {
  const converted = angleFromArcmin(angleToArcmin(value, fromUnit), toUnit);
  return Number(converted.toFixed(ANGLE_UNITS[toUnit].digits));
}

function positive(value, name) {
  if (!(value > 0) || !Number.isFinite(value)) throw new RangeError(`${name} must be a positive number`);
}

// The height (in the units of `distance`) of a letter that spans `angleArcmin` at `distance`.
export function heightFor(distance, angleArcmin) {
  positive(distance, 'distance');
  positive(angleArcmin, 'angle');
  return 2 * distance * Math.tan(toRadians(angleArcmin) / 2);
}

// The angle, in minutes of arc, that a letter of `height` spans at `distance` (both in the same units).
export function angleFor(height, distance) {
  positive(height, 'height');
  positive(distance, 'distance');
  return toArcmin(2 * Math.atan(height / (2 * distance)));
}

// The distance (in the units of `height`) at which a letter of `height` spans `angleArcmin`.
export function distanceFor(height, angleArcmin) {
  positive(height, 'height');
  positive(angleArcmin, 'angle');
  return height / (2 * Math.tan(toRadians(angleArcmin) / 2));
}

// Work out the missing one of the three. `solving` is 'height', 'distance' or 'angle'; the other two must be
// given as positive numbers (height and distance in the same length unit, the angle in minutes of arc).
// Returns all three, the given ones as they were.
export function solve(solving, { height, distance, angleArcmin }) {
  switch (solving) {
    case 'height':
      return { height: heightFor(distance, angleArcmin), distance, angleArcmin };
    case 'distance':
      return { height, distance: distanceFor(height, angleArcmin), angleArcmin };
    case 'angle':
      return { height, distance, angleArcmin: angleFor(height, distance) };
    default:
      throw new RangeError(`cannot work out "${solving}"`);
  }
}

// An angle read back from storage (in minutes of arc), or null if it is not usable: it must be a finite number
// inside the limits the page accepts. Saved data is not trusted.
export function restoredAngleArcmin(saved) {
  const { min, max } = ANGLE_LIMITS_ARCMIN;
  return typeof saved === 'number' && Number.isFinite(saved) && saved >= min && saved <= max ? saved : null;
}
