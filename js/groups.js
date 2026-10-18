// Exercise groups: named, ordered lists of exercises.

import { count } from './format.js';

/**
 * @typedef {object} Group
 * @property {string} id
 * @property {string} name
 * @property {string[]} exercises
 */

export const NAME_MAX = 40;
export const EXERCISE_MAX = 40;
export const EXERCISES_MAX = 30;

/** Short unique id: time plus a random suffix. */
export function newId(now = Date.now(), random = Math.random) {
  return now.toString(36) + random().toString(36).slice(2, 6);
}

/** @param {unknown[]} lines */
function cleanExercises(lines) {
  return lines
    .filter((x) => typeof x === 'string')
    .map((x) => /** @type {string} */ (x).trim().slice(0, EXERCISE_MAX))
    .filter(Boolean);
}

/**
 * Validate a group from storage or a backup. Returns null if unusable.
 * @param {unknown} raw
 * @returns {Group|null}
 */
export function cleanGroup(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const g = /** @type {Record<string, unknown>} */ (raw);
  if (typeof g.name !== 'string' || !Array.isArray(g.exercises)) return null;
  const name = g.name.trim().slice(0, NAME_MAX);
  const exercises = cleanExercises(g.exercises).slice(0, EXERCISES_MAX);
  if (!name || !exercises.length) return null;
  return { id: String(g.id || newId()), name, exercises };
}

/**
 * @param {unknown} raw
 * @returns {Group[]}
 */
export function sanitizeGroups(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(cleanGroup).filter((g) => g !== null);
}

/**
 * Validate editor input: a name and one exercise per line.
 * @param {string} name
 * @param {string} text
 * @returns {{error: string} | {name: string, exercises: string[]}}
 */
export function parseGroupInput(name, text) {
  const cleanName = name.trim().slice(0, NAME_MAX);
  const exercises = cleanExercises(text.split('\n'));
  if (!cleanName) return { error: 'Give the group a name.' };
  if (!exercises.length) return { error: 'Add at least one exercise, one per line.' };
  if (exercises.length > EXERCISES_MAX) {
    return { error: `Keep it to ${EXERCISES_MAX} exercises or fewer.` };
  }
  return { name: cleanName, exercises };
}

/**
 * Exercise for a 1-based round. The list wraps around when rounds exceed it.
 * @param {Group} group
 * @param {number} round
 */
export function exerciseFor(group, round) {
  return group.exercises[(round - 1) % group.exercises.length];
}

/**
 * Explain how the group's list maps onto the configured rounds and sets.
 * @param {Group} group
 * @param {number} rounds
 * @param {number} sets
 */
export function groupNote(group, rounds, sets) {
  const n = group.exercises.length;
  let note;
  if (rounds < n) {
    note = `Only the first ${rounds} of ${n} exercises fit in ${count(rounds, 'round')}.`;
  } else if (rounds % n === 0) {
    note = rounds === n ? 'One pass through the list.' : `Goes through the list ${rounds / n} times.`;
  } else {
    const passes = Math.floor(rounds / n);
    note = `Goes through the list ${passes === 1 ? 'once' : `${passes} times`}, then ${rounds % n} more.`;
  }
  if (sets > 1) note += ` Then the whole set repeats, ${sets} sets in all.`;
  return note;
}
