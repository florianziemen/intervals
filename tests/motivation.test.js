import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TRAITS } from '../js/fight.js';
import {
  CHEERS,
  GREETINGS,
  PERSONAL_CHEERS,
  PEP_TALKS,
  PERSONAL_GREETINGS,
  REST_TALK_CHANCE,
  TALK_MIN_SECONDS,
  WEIGHTS,
  cheer,
  greeting,
  pepTalk,
  pick,
} from '../js/motivation.js';
import { SEASONS } from '../js/seasons.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
const session = (date, id = date.toISOString()) => ({
  id,
  at: date.toISOString(),
  work: 30,
  rest: 10,
  rounds: 10,
  planned: 10,
});
const general = [GREETINGS.morning, GREETINGS.afternoon, GREETINGS.evening, GREETINGS.any].flat();
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
    assert.ok(GREETINGS.first.includes(greeting([], at(2026, 10, 14))));
  });

  it('greets by time of day when a general message is picked', () => {
    const log = [session(at(2026, 10, 13))];
    // Options: no gear (8), morning (2), any time (1). 0.8 of 11 lands on morning.
    const rolls = [0.8, 0];
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
    assert.ok(CHEERS.first.includes(cheer({ full: true }, [session(now)], now)));
    const log = [session(at(2026, 10, 13)), session(now)];
    assert.ok(CHEERS.partial.includes(cheer({ full: false }, log, now)));
    assert.ok(CHEERS.full.includes(cheer({ full: true }, log, now, never)));
  });

  it('notices the biggest day', () => {
    const now = at(2026, 10, 14);
    const log = [session(at(2026, 10, 1)), session(at(2026, 10, 14, 8), 'a'), session(now, 'b')];
    assert.match(cheer({ full: true }, log, now, always), /biggest day/);
  });

  it('has several lines for every situation, all filled in', () => {
    const c = { streak: 3, thisWeek: 4, trait: TRAITS[1] };
    for (const sets of [GREETINGS, PERSONAL_GREETINGS, CHEERS, PERSONAL_CHEERS, PEP_TALKS]) {
      for (const [name, lines] of Object.entries(sets)) {
        assert.ok(lines.length >= 3, `${name} has fewer than 3 lines`);
        assert.equal(new Set(lines).size, lines.length, `${name} has duplicates`);
        for (const line of lines) {
          const text = typeof line === 'function' ? line(c) : line;
          assert.doesNotMatch(text, /undefined|NaN|'/, `${name}: ${text}`);
        }
      }
    }
  });

  it('picks situations by weight, and any line within one', () => {
    const log = [session(at(2026, 10, 13))]; // no gear, nothing yet today
    const now = at(2026, 10, 14, 8);
    const W = WEIGHTS.greeting;
    const total = W.emptyPawed + W.partOfDay + W.any;
    const counts = { emptyPawed: 0, morning: 0, any: 0 };
    const n = 1100;
    for (let i = 0; i < n; i++) {
      const rolls = [(i + 0.5) / n, 0];
      const msg = greeting(log, now, () => rolls.shift() ?? 0);
      if (PERSONAL_GREETINGS.emptyPawed.includes(msg)) counts.emptyPawed += 1;
      else if (GREETINGS.morning.includes(msg)) counts.morning += 1;
      else if (GREETINGS.any.includes(msg)) counts.any += 1;
    }
    assert.deepEqual(counts, {
      emptyPawed: (n * W.emptyPawed) / total,
      morning: (n * W.partOfDay) / total,
      any: (n * W.any) / total,
    });
    assert.ok(W.emptyPawed > W.partOfDay && W.partOfDay > W.any);

    const seen = new Set();
    for (let i = 0; i < GREETINGS.any.length; i++) {
      const rolls = [0.99, (i + 0.5) / GREETINGS.any.length];
      seen.add(greeting(log, now, () => rolls.shift() ?? 0));
    }
    assert.equal(seen.size, GREETINGS.any.length);
  });

  it('adds the season to greetings and cheers', () => {
    // Halloween, no gear, nothing yet today: emptyPawed (8) then seasonal (4).
    const log = [session(at(2026, 10, 27))];
    const now = at(2026, 10, 28);
    const halloween = SEASONS.find((s) => s.key === 'halloween');
    const W = WEIGHTS.greeting;
    const total = W.emptyPawed + W.seasonal + W.partOfDay + W.any;
    const rolls = [(W.emptyPawed + 0.5) / total, 0];
    assert.equal(
      greeting(log, now, () => rolls.shift() ?? 0),
      halloween.greetings[0],
    );
    // Cheer options: survived, biggest day, week count, then seasonal.
    const C = WEIGHTS.cheer;
    const before = C.survived + C.biggest + C.weekCount;
    const cheerRolls = [(before + 0.5) / (before + C.seasonal + C.full), 0];
    const done = [...log, session(now)];
    assert.equal(
      cheer({ full: true }, done, now, () => cheerRolls.shift() ?? 0),
      halloween.cheers[0],
    );
  });

  describe('pep talks', () => {
    const plan = { rounds: 4, sets: 3 };
    const rest = (set, round, dur = 15) => ({ type: 'rest', dur, set, round });
    const brk = (set) => ({ type: 'break', dur: 60, set, round: 4 });

    it('always talks at the start, between sets and before the last round', () => {
      assert.equal(pepTalk({ type: 'prep', dur: 5, set: 1, round: 0 }, plan, never), PEP_TALKS.start.at(-1));
      assert.ok(PEP_TALKS.setBreak.includes(pepTalk(brk(1), plan, never)));
      assert.ok(PEP_TALKS.lastSet.includes(pepTalk(brk(2), plan, never)));
      // With setRest 0 the end of a set is a normal rest.
      assert.ok(PEP_TALKS.setBreak.includes(pepTalk(rest(1, 4), plan, never)));
      assert.ok(PEP_TALKS.lastRound.includes(pepTalk(rest(3, 3), plan, never)));
    });

    it('talks in some ordinary rests only', () => {
      const below = () => REST_TALK_CHANCE - 0.01;
      assert.ok(PEP_TALKS.rest.includes(pepTalk(rest(1, 1), plan, below)));
      assert.equal(
        pepTalk(rest(1, 1), plan, () => REST_TALK_CHANCE),
        null,
      );
      // The last round of an earlier set is not the last round of the workout.
      assert.equal(pepTalk(rest(1, 3), plan, never), null);
    });

    it('stays quiet during work and in rests too short to read', () => {
      assert.equal(pepTalk({ type: 'work', dur: 30, set: 1, round: 1 }, plan, always), null);
      assert.equal(pepTalk(rest(3, 3, TALK_MIN_SECONDS - 1), plan, always), null);
      assert.equal(pepTalk({ ...brk(2), dur: 5 }, plan, always), null);
    });
  });
});
