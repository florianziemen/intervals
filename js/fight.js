// Wally vs the zombies. Every full week of daily exercise (Monday to Sunday)
// earns Wally one piece of gear; every past day without exercise costs the
// newest one. A missed day with nothing left to lose turns him into a zombie,
// and the next workout cures him. Inspired by Zombicide.

import { CALENDAR_WEEKS, addDays, dayKey, parseDayKey, totalsByDay } from './stats.js';

/**
 * @typedef {object} Trait
 * @property {string} emoji
 * @property {string} name  with its article, e.g. "a frying pan"
 */

/**
 * @typedef {object} FightEvent
 * @property {'gain'|'loss'|'zombie'|'cure'} kind
 * @property {string} key    day it happened, "YYYY-MM-DD"
 * @property {Trait} [trait] gained or lost
 */

/**
 * @typedef {object} FightState
 * @property {Trait[]} traits     what Wally has, oldest first
 * @property {boolean} zombie
 * @property {FightEvent|null} last  most recent change
 */

/** Gear in the order it is found. One per full week, so all of it takes the whole calendar. */
export const TRAITS = Object.freeze([
  { emoji: '🍳', name: 'a frying pan' },
  { emoji: '🏏', name: 'a cricket bat' },
  { emoji: '🥾', name: 'steel-capped boots' },
  { emoji: '🪖', name: 'a helmet' },
  { emoji: '🪓', name: 'a fire axe' },
  { emoji: '🛡️', name: 'a riot shield' },
]);

export const MAX_LEVEL = TRAITS.length;

/**
 * Replay the log day by day, from the first workout to today. Today only
 * counts once it has exercise; it can't be missed until it is over.
 * @param {import('./log.js').Session[]} log
 * @param {Date} now
 * @returns {FightState}
 */
export function fightState(log, now) {
  /** @type {FightState} */
  const state = { traits: [], zombie: false, last: null };
  const active = totalsByDay(log);
  if (!active.size) return state;

  const today = dayKey(now);
  const first = [...active.keys()].sort()[0];
  let run = 0; // consecutive days with exercise
  for (let d = parseDayKey(first), key = first; key <= today; d = addDays(d, 1), key = dayKey(d)) {
    if (active.has(key)) {
      run += 1;
      if (state.zombie) {
        state.zombie = false;
        state.last = { kind: 'cure', key };
      }
      // Sunday that closes a week with exercise every day.
      if (d.getDay() === 0 && run >= 7 && state.traits.length < MAX_LEVEL) {
        const trait = TRAITS[state.traits.length];
        state.traits.push(trait);
        state.last = { kind: 'gain', key, trait };
      }
    } else if (key < today) {
      run = 0;
      if (state.zombie) continue;
      const trait = state.traits.pop();
      if (trait) {
        state.last = { kind: 'loss', key, trait };
      } else {
        state.zombie = true;
        state.last = { kind: 'zombie', key };
      }
    }
  }
  return state;
}

/**
 * One line about where Wally stands.
 * @param {FightState} state
 */
export function fightLine(state) {
  if (state.zombie) return 'Wally has turned into a zombie. Braaains… One workout cures him.';
  const level = state.traits.length;
  if (level === MAX_LEVEL) {
    return `Fully armed after ${CALENDAR_WEEKS} weeks! Every day without exercise costs one piece of gear.`;
  }
  const next = `Exercise every day from Monday to Sunday to find new gear.`;
  if (level) return `Level ${level} of ${MAX_LEVEL}. ${next}`;
  return `Wally is empty-pawed: one day without exercise and he turns. ${next}`;
}
