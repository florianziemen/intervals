// What the wallaby says: a greeting on page entry and a cheer after a workout.

import { dayKey, summary, totalsByDay } from './stats.js';

/** @typedef {() => number} Random  returns a number in [0, 1) */

/** Share of picks that use a message about the user's own log, when one applies. */
const PERSONAL_SHARE = 0.6;

export const GREETINGS = Object.freeze({
  morning: ['Morning! Legs ready to hop?', 'Early bounce, best bounce.', 'Rise and hop!'],
  afternoon: [
    'Perfect time for a quick hop.',
    'Shake off the afternoon slump!',
    'A few rounds now, a better evening later.',
  ],
  evening: [
    'One short session before the couch?',
    'End the day on a bounce.',
    'Evening hops count double. Well, almost.',
  ],
  any: [
    'You don’t have to go fast. You just have to go.',
    'Small hops add up to big leaps.',
    'Strong tail, strong mind. Let’s go!',
    'Every round makes the next one easier.',
  ],
});

export const CHEERS = Object.freeze({
  full: [
    'Bonzer! You crushed it.',
    'That’s a full workout. Proud of you!',
    'Hop hop hooray!',
    'Done and dusted. Have a drink of water.',
    'You showed up and finished. That’s the whole trick.',
  ],
  partial: [
    'Every round counts. Nice work.',
    'Some is way more than none. Logged!',
    'Short hop today, still a hop.',
  ],
});

/**
 * @template T
 * @param {readonly T[]} list
 * @param {Random} rand
 */
export function pick(list, rand) {
  return list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
}

/** @param {string[]} personal @param {readonly string[]} general @param {Random} rand */
function choose(personal, general, rand) {
  return personal.length && rand() < PERSONAL_SHARE ? pick(personal, rand) : pick(general, rand);
}

/** @param {Date} now */
function partOfDay(now) {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

/**
 * Greeting shown when the page opens.
 * @param {import('./log.js').Session[]} log
 * @param {Date} now
 * @param {Random} [rand]
 */
export function greeting(log, now, rand = Math.random) {
  if (!log.length) return 'G’day! I’m Wally. Let’s hop into your first workout.';
  const { thisWeek, streak } = summary(log, now);
  const today = totalsByDay(log).get(dayKey(now));
  /** @type {string[]} */
  const personal = [];
  if (today) personal.push('Back for more today? Legend.');
  else if (streak && !thisWeek) personal.push(`New week! Keep your ${streak}-week streak hopping.`);
  if (streak >= 2) personal.push(`${streak} weeks in a row. You’re on a roll!`);
  if (thisWeek >= 3) personal.push(`${thisWeek} workouts this week already. Bouncy!`);
  return choose(personal, [...GREETINGS[partOfDay(now)], ...GREETINGS.any], rand);
}

/**
 * Cheer shown when a logged workout ends.
 * @param {{full: boolean}} result  full: every phase ran to the end
 * @param {import('./log.js').Session[]} log  including the session just logged
 * @param {Date} now
 * @param {Random} [rand]
 */
export function cheer({ full }, log, now, rand = Math.random) {
  if (log.length === 1) return 'Your very first workout! This is how every streak starts.';
  if (!full) return pick(CHEERS.partial, rand);
  const totals = totalsByDay(log);
  const today = totals.get(dayKey(now))?.seconds ?? 0;
  const best = Math.max(...[...totals.values()].map((d) => d.seconds));
  const { thisWeek } = summary(log, now);
  /** @type {string[]} */
  const personal = [];
  if (today >= best && totals.size > 1) personal.push('Your biggest day yet! Top roo.');
  if (thisWeek >= 2) personal.push(`Workout ${thisWeek} this week. Keep hopping!`);
  return choose(personal, CHEERS.full, rand);
}
