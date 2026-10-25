import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { SEASONS, activeSeason, easterSunday } from '../js/seasons.js';

const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
const key = (y, m, d, h) => activeSeason(day(y, m, d, h))?.key;

describe('seasons', () => {
  it('finds Easter Sunday', () => {
    assert.deepEqual(easterSunday(2024), new Date(2024, 2, 31));
    assert.deepEqual(easterSunday(2025), new Date(2025, 3, 20));
    assert.deepEqual(easterSunday(2026), new Date(2026, 3, 5));
    assert.deepEqual(easterSunday(2027), new Date(2027, 2, 28));
    assert.deepEqual(easterSunday(2038), new Date(2038, 3, 25));
  });

  it('runs Easter from Good Friday to Easter Monday', () => {
    assert.equal(key(2026, 4, 2), undefined);
    assert.equal(key(2026, 4, 3, 0), 'easter');
    assert.equal(key(2026, 4, 6, 23), 'easter');
    assert.equal(key(2026, 4, 7), undefined);
  });

  it('starts and ends on the right local days', () => {
    assert.equal(key(2026, 12, 31), undefined);
    assert.equal(key(2027, 1, 1, 0), 'newYear');
    assert.equal(key(2027, 1, 7, 23), 'newYear');
    assert.equal(key(2027, 1, 8), undefined);
    assert.equal(key(2028, 2, 29), 'mardiGras');
    assert.equal(key(2026, 6, 1), 'pride');
    assert.equal(key(2026, 7, 1), undefined);
    assert.equal(key(2026, 9, 30), 'magpies');
    assert.equal(key(2026, 10, 23), undefined);
    assert.equal(key(2026, 10, 31), 'halloween');
    assert.equal(key(2026, 12, 25), 'christmas');
    assert.equal(key(2026, 12, 26), 'boxingDay');
  });

  it('never runs two seasons on the same day', () => {
    for (const year of [2026, 2027, 2028]) {
      for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
        const active = SEASONS.filter((s) => s.active(d)).map((s) => s.key);
        assert.ok(active.length <= 1, `${d.toDateString()}: ${active}`);
      }
    }
  });

  it('has lines and a cached outfit for every season', () => {
    const root = new URL('..', import.meta.url);
    const sw = readFileSync(new URL('sw.js', root), 'utf8');
    for (const s of SEASONS) {
      for (const lines of [s.greetings, s.cheers]) {
        assert.ok(lines.length >= 3, `${s.key} has fewer than 3 lines`);
        assert.equal(new Set(lines).size, lines.length, `${s.key} has duplicates`);
        for (const line of lines) assert.doesNotMatch(line, /'/, `${s.key}: ${line}`);
      }
      const file = `outfits/${s.outfit}.svg`;
      assert.ok(existsSync(new URL(file, root)), `${file} is missing`);
      assert.ok(sw.includes(`'./${file}'`), `${file} missing from FILES in sw.js`);
    }
  });
});
