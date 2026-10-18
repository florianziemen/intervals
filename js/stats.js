// History statistics and the 6-week calendar. Weeks start on Monday.

import { exerciseSeconds } from './log.js';

/**
 * @typedef {object} DayTotal
 * @property {number} count    sessions that day
 * @property {number} seconds  exercise time that day
 * @property {string[]} groups distinct group names that day
 */

/**
 * @typedef {object} CalendarDay
 * @property {Date} date
 * @property {string} key
 * @property {boolean} today
 * @property {boolean} future
 */

export const CALENDAR_WEEKS = 6;
export const BEST_EMOJI = '🦘';
export const NONE_EMOJI = '🧟';

/** Daily exercise tiers, highest first. `min` is in seconds. */
export const TIERS = [
  { min: 1500, emoji: '🦁', label: '25 min or more' },
  { min: 900, emoji: '🐆', label: '15–25 min' },
  { min: 600, emoji: '🦊', label: '10–15 min' },
  { min: 300, emoji: '🐇', label: '5–10 min' },
  { min: 1, emoji: '🐢', label: 'under 5 min' },
];

/** Local calendar date as "YYYY-MM-DD". @param {Date} d */
export function dayKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** @param {string} key "YYYY-MM-DD" */
export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** @param {Date} d @param {number} n */
export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Midnight of the Monday of d's week. @param {Date} d */
export function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(x, -((x.getDay() + 6) % 7));
}

/** @param {number} sec  exercise seconds in a day */
export function tierEmoji(sec) {
  return TIERS.find((t) => sec >= t.min)?.emoji ?? NONE_EMOJI;
}

/**
 * Group sessions by local day.
 * @param {import('./log.js').Session[]} log
 * @returns {Map<string, DayTotal>}
 */
export function totalsByDay(log) {
  const days = new Map();
  for (const s of log) {
    const key = dayKey(new Date(s.at));
    const day = days.get(key) ?? { count: 0, seconds: 0, groups: [] };
    day.count += 1;
    day.seconds += exerciseSeconds(s);
    if (s.group && !day.groups.includes(s.group)) day.groups.push(s.group);
    days.set(key, day);
  }
  return days;
}

/**
 * The three headline numbers.
 * @param {import('./log.js').Session[]} log
 * @param {Date} now
 */
export function summary(log, now) {
  const monday = startOfWeek(now);
  const cutoff = addDays(now, -30);
  const activeWeeks = new Set(log.map((s) => dayKey(startOfWeek(new Date(s.at)))));

  // The current week does not break the streak while it is still empty.
  let streak = 0;
  let week = activeWeeks.has(dayKey(monday)) ? monday : addDays(monday, -7);
  while (activeWeeks.has(dayKey(week))) {
    streak += 1;
    week = addDays(week, -7);
  }

  let recentSeconds = 0;
  for (const s of log) if (new Date(s.at) >= cutoff) recentSeconds += exerciseSeconds(s);

  return {
    thisWeek: log.filter((s) => new Date(s.at) >= monday).length,
    streak,
    recentMinutes: Math.round(recentSeconds / 60),
  };
}

/**
 * The last CALENDAR_WEEKS weeks, Monday to Sunday, and the best day among them.
 * @param {Map<string, DayTotal>} totals
 * @param {Date} now
 * @returns {{days: CalendarDay[], best: number}}
 */
export function calendar(totals, now) {
  const today = dayKey(now);
  const first = addDays(startOfWeek(now), -7 * (CALENDAR_WEEKS - 1));
  const days = [];
  let best = 0;
  for (let i = 0; i < CALENDAR_WEEKS * 7; i++) {
    const date = addDays(first, i);
    const key = dayKey(date);
    best = Math.max(best, totals.get(key)?.seconds ?? 0);
    days.push({ date, key, today: key === today, future: date > now && key !== today });
  }
  return { days, best };
}

/**
 * Emoji for a day: the kangaroo for the best day, else the tier animal.
 * @param {number} seconds  that day's exercise time
 * @param {number} best     best day's exercise time
 */
export function dayEmoji(seconds, best) {
  return seconds > 0 && seconds === best ? BEST_EMOJI : tierEmoji(seconds);
}
