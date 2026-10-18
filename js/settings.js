// Workout settings: limits, defaults, validation and derived values.

/**
 * @typedef {object} Settings
 * @property {number} work     seconds per work interval
 * @property {number} rest     seconds between rounds
 * @property {number} rounds   rounds per set
 * @property {number} sets     times the round sequence runs
 * @property {number} setRest  break between sets in seconds (0 = use normal rest)
 * @property {boolean} sound   beeps and vibration
 * @property {string|null} group  id of the selected exercise group
 */

/** @typedef {'work'|'rest'|'rounds'|'sets'|'setRest'} NumericField */

export const PREP_SECONDS = 5;

/** @type {Record<NumericField, [number, number]>} */
export const LIMITS = {
  work: [5, 300],
  rest: [0, 300],
  rounds: [1, 50],
  sets: [1, 10],
  setRest: [0, 600],
};

/** @type {Readonly<Settings>} */
export const DEFAULTS = Object.freeze({
  work: 30,
  rest: 30,
  rounds: 10,
  sets: 1,
  setRest: 60,
  sound: true,
  group: null,
});

/**
 * Round and clamp a value into the allowed range of a field.
 * @param {NumericField} field
 * @param {number} value
 */
export function clampField(field, value) {
  const [min, max] = LIMITS[field];
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Build valid settings from untrusted stored data, field by field.
 * @param {unknown} raw
 * @param {ReadonlyArray<{id: string}>} groups  known groups; an unknown group id is dropped
 * @returns {Settings}
 */
export function sanitizeSettings(raw, groups) {
  const src = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
  const out = { ...DEFAULTS };
  for (const field of /** @type {NumericField[]} */ (Object.keys(LIMITS))) {
    const v = Number(src[field]);
    if (src[field] != null && Number.isFinite(v)) out[field] = clampField(field, v);
  }
  if (typeof src.sound === 'boolean') out.sound = src.sound;
  if (typeof src.group === 'string' && groups.some((g) => g.id === src.group)) out.group = src.group;
  return out;
}

/**
 * Seconds from the first work interval to the end, without the prep countdown.
 * @param {Settings} s
 */
export function workoutSeconds(s) {
  const perSet = s.work * s.rounds + s.rest * (s.rounds - 1);
  const between = s.setRest > 0 ? s.setRest : s.rest;
  return s.sets * perSet + (s.sets - 1) * between;
}
