import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CHEERS, GREETINGS, cheer, greeting, pick } from '../js/motivation.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
const session = (date, id = date.toISOString()) => ({
  id,
  at: date.toISOString(),
  work: 30,
  rest: 10,
  rounds: 10,
  planned: 10,
});
const general = [...Object.values(GREETINGS).flat()];
const always = () => 0; // personal message, first in its list
const never = () => 0.99; // general message, last in its list

describe('motivation', () => {
  it('picks within bounds', () => {
    assert.equal(
      pick(['a', 'b'], () => 0),
      'a',
    );
    assert.equal(
      pick(['a', 'b'], () => 0.999),
      'b',
    );
    assert.equal(
      pick(['a'], () => 1),
      'a',
    );
  });

  it('welcomes first-time users', () => {
    assert.match(greeting([], at(2026, 10, 14)), /first workout/);
  });

  it('greets by time of day when a general message is picked', () => {
    const log = [session(at(2026, 10, 13))];
    const rolls = [0.99, 0]; // general, then the first one
    const msg = greeting(log, at(2026, 10, 14, 8), () => rolls.shift() ?? 0);
    assert.equal(msg, GREETINGS.morning[0]);
    assert.equal(greeting(log, at(2026, 10, 14, 22), never), GREETINGS.any.at(-1));
  });

  it('mentions the streak and today', () => {
    // Monday 2026-10-12; workouts every day of the two previous weeks, none yet today.
    const log = Array.from({ length: 14 }, (_, i) => session(at(2026, 9, 28 + i)));
    assert.match(greeting(log, at(2026, 10, 12), always), /2-week streak/);
    const today = [...log, session(at(2026, 10, 12, 9))];
    assert.match(greeting(today, at(2026, 10, 12), always), /today/);
    assert.ok(general.includes(greeting(today, at(2026, 10, 12), never)));
  });

  it('cheers a first, partial and full workout', () => {
    const now = at(2026, 10, 14);
    assert.match(cheer({ full: true }, [session(now)], now), /first workout/);
    const log = [session(at(2026, 10, 13)), session(now)];
    assert.ok(CHEERS.partial.includes(cheer({ full: false }, log, now)));
    assert.ok(CHEERS.full.includes(cheer({ full: true }, log, now, never)));
  });

  it('notices the biggest day', () => {
    const now = at(2026, 10, 14);
    const log = [session(at(2026, 10, 1)), session(at(2026, 10, 14, 8), 'a'), session(now, 'b')];
    assert.match(cheer({ full: true }, log, now, always), /biggest day/);
  });
});
