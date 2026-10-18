// Workout log: session records, validation, backup and restore.

import { short } from './format.js';
import { cleanGroup, NAME_MAX } from './groups.js';
import { LIMITS } from './settings.js';

/**
 * @typedef {object} Session
 * @property {string} id
 * @property {string} at       ISO timestamp of when the workout ended
 * @property {number} work     seconds
 * @property {number} rest     seconds
 * @property {number} rounds   completed work intervals across all sets
 * @property {number} planned  rounds * sets that were planned
 * @property {number} [sets]   only present when > 1
 * @property {string} [group]  group name at the time
 */

export const BACKUP_VERSION = 2;

/** @param {unknown} v */
function nonNegative(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Validate a session from storage or a backup. Returns null if unusable.
 * @param {unknown} raw
 * @returns {Session|null}
 */
export function sanitizeSession(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const s = /** @type {Record<string, unknown>} */ (raw);
  if (typeof s.at !== 'string') return null;
  const time = Date.parse(s.at);
  if (Number.isNaN(time)) return null;
  const rounds = nonNegative(s.rounds);
  /** @type {Session} */
  const out = {
    id: String(s.id || time.toString(36)),
    at: s.at,
    work: nonNegative(s.work),
    rest: nonNegative(s.rest),
    rounds,
    planned: nonNegative(s.planned) || rounds,
  };
  const sets = Math.round(Number(s.sets));
  if (sets > 1) out.sets = Math.min(LIMITS.sets[1], sets);
  if (typeof s.group === 'string') out.group = s.group.slice(0, NAME_MAX);
  return out;
}

/**
 * @param {unknown} raw
 * @returns {Session[]}
 */
export function sanitizeLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeSession).filter((s) => s !== null);
}

/**
 * Record a finished workout.
 * @param {object} p
 * @param {import('./settings.js').Settings} p.settings
 * @param {import('./groups.js').Group|null} p.group
 * @param {number} p.completed  work intervals completed
 * @param {Date} p.at
 * @param {string} p.id
 * @returns {Session}
 */
export function createSession({ settings, group, completed, at, id }) {
  /** @type {Session} */
  const s = {
    id,
    at: at.toISOString(),
    work: settings.work,
    rest: settings.rest,
    rounds: completed,
    planned: settings.rounds * settings.sets,
  };
  if (settings.sets > 1) s.sets = settings.sets;
  if (group) s.group = group.name;
  return s;
}

/** Exercise time of a session: work intervals only, no rest. @param {Session} s */
export function exerciseSeconds(s) {
  return s.work * s.rounds;
}

/** One-line summary, e.g. "Legs: 8 of 10 × 30s / 15s in 2 sets". @param {Session} s */
export function describeSession(s) {
  return (
    (s.group ? `${s.group}: ` : '') +
    s.rounds +
    (s.rounds < s.planned ? ` of ${s.planned}` : '') +
    ` × ${short(s.work)}` +
    (s.rest ? ` / ${short(s.rest)}` : '') +
    (s.sets && s.sets > 1 ? ` in ${s.sets} sets` : '')
  );
}

/**
 * Newest first.
 * @param {Session[]} log
 * @param {number} limit
 */
export function recentSessions(log, limit) {
  return [...log].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}

/**
 * @param {Session[]} workouts
 * @param {import('./groups.js').Group[]} groups
 */
export function toBackup(workouts, groups) {
  return JSON.stringify({ app: 'intervals', version: BACKUP_VERSION, workouts, groups });
}

/**
 * Parse any backup version: a bare array of workouts (v1) or the v2 object.
 * Invalid entries are dropped. Throws if the text is not a backup at all.
 * @param {string} text
 * @returns {{workouts: Session[], groups: import('./groups.js').Group[]}}
 */
export function parseBackup(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data?.workouts;
  if (!Array.isArray(list)) throw new Error('Not a backup');
  const rawGroups = !Array.isArray(data) && Array.isArray(data.groups) ? data.groups : [];
  return {
    workouts: sanitizeLog(list),
    groups: rawGroups.map(cleanGroup).filter((g) => g !== null),
  };
}

/**
 * Append incoming items whose id is not present yet. Never overwrites.
 * @template {{id: string}} T
 * @param {T[]} existing
 * @param {T[]} incoming
 * @returns {{merged: T[], added: number}}
 */
export function mergeById(existing, incoming) {
  const ids = new Set(existing.map((x) => x.id));
  const fresh = incoming.filter((x) => !ids.has(x.id) && ids.add(x.id));
  return { merged: [...existing, ...fresh], added: fresh.length };
}
