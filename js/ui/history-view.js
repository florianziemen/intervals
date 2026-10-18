// Stats, the 6-week calendar, day details and the recent workouts list.

import { clock, count, long } from '../format.js';
import { describeSession, exerciseSeconds, recentSessions } from '../log.js';
import {
  BEST_EMOJI,
  CALENDAR_WEEKS,
  NONE_EMOJI,
  TIERS,
  calendar,
  dayEmoji,
  dayKey,
  parseDayKey,
  summary,
  totalsByDay,
} from '../stats.js';
import { byId, el, twoTap } from './dom.js';

const RECENT_LIMIT = 25;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY_DAY = { count: 0, seconds: 0, groups: /** @type {string[]} */ ([]) };

/**
 * @param {import('../store.js').Store} store
 * @param {() => Date} now  injectable clock
 */
export function initHistoryView(store, now = () => new Date()) {
  const grid = byId('grid');
  const detail = byId('daydetail');
  const logArea = byId('logArea');

  /** @type {string|null} */
  let selected = null;
  /** @type {Map<string, import('../stats.js').DayTotal>} */
  let totals = new Map();
  let best = 0;

  renderLegend();

  /** @param {string} key */
  function showDay(key) {
    selected = key;
    for (const c of grid.querySelectorAll('.cell')) {
      c.classList.toggle('sel', /** @type {HTMLElement} */ (c).dataset.k === key);
    }
    const label = parseDayKey(key).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const day = totals.get(key) ?? EMPTY_DAY;
    if (day.count) {
      const emoji = dayEmoji(day.seconds, best);
      const groups = day.groups.length ? ` (${day.groups.join(', ')})` : '';
      const bestNote = emoji === BEST_EMOJI ? ` Your best day in the last ${CALENDAR_WEEKS} weeks.` : '';
      detail.textContent = `${emoji} ${label}: ${long(day.seconds)} of exercise in ${count(day.count, 'workout')}${groups}.${bestNote}`;
    } else if (key === dayKey(now())) {
      detail.textContent = `${label}: nothing yet today. Finish a round to keep the zombie away.`;
    } else {
      detail.textContent = `${NONE_EMOJI} ${label}: no exercise.`;
    }
  }

  /** @param {import('../stats.js').CalendarDay} d */
  function dayCell(d) {
    if (d.future) return el('div', { className: 'cell future', attrs: { 'aria-hidden': 'true' } });
    const day = totals.get(d.key) ?? EMPTY_DAY;
    let emoji = d.today ? '·' : NONE_EMOJI;
    if (day.count) emoji = dayEmoji(day.seconds, best);
    const fullDate = d.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const cell = el(
      'button',
      {
        className: ['cell', day.count && 'on', d.today && 'today'].filter(Boolean).join(' '),
        attrs: {
          'data-k': d.key,
          'aria-label': `${fullDate}, ${day.count ? `${long(day.seconds)} of exercise` : 'no exercise'}`,
        },
      },
      [
        el('span', { className: 'dn', text: d.date.getDate() }),
        el('span', { className: 'em', text: emoji }),
        el('span', { className: 'tm', text: day.count ? clock(day.seconds) : '' }),
      ],
    );
    cell.addEventListener('click', () => showDay(d.key));
    return cell;
  }

  /** @param {import('../log.js').Session} s */
  function sessionItem(s) {
    const d = new Date(s.at);
    const when =
      `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ` +
      `${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}, ` +
      `${clock(exerciseSeconds(s))} exercise`;
    const del = /** @type {HTMLButtonElement} */ (
      el('button', {
        className: 'del',
        text: 'Delete',
        attrs: { 'aria-label': `Delete workout from ${when}` },
      })
    );
    twoTap(del, 'Tap to confirm', () => store.deleteSession(s.id));
    return el('li', {}, [
      el('div', {}, [
        el('div', { className: 'what', text: describeSession(s) }),
        el('div', { className: 'when', text: when }),
      ]),
      del,
    ]);
  }

  function render() {
    const { log } = store.state;
    const today = now();
    totals = totalsByDay(log);

    const stats = summary(log, today);
    byId('s-week').textContent = String(stats.thisWeek);
    byId('s-streak').textContent = String(stats.streak);
    byId('s-min').textContent = String(stats.recentMinutes);

    const cal = calendar(totals, today);
    best = cal.best;
    grid.replaceChildren(
      ...WEEKDAYS.map((w) => el('div', { className: 'dow', text: w })),
      ...cal.days.map(dayCell),
    );
    showDay(selected ?? dayKey(today));

    logArea.replaceChildren(
      log.length
        ? el('ul', { className: 'log' }, recentSessions(log, RECENT_LIMIT).map(sessionItem))
        : el('div', {
            className: 'empty',
            text: 'No workouts yet. Finish at least one round and it shows up here.',
          }),
    );
  }

  store.subscribe(render);
  render();
}

function renderLegend() {
  const entries = [
    ...[...TIERS].reverse().map((t) => `${t.emoji} ${t.label}`),
    `${NONE_EMOJI} no exercise`,
    `${BEST_EMOJI} best day in these ${CALENDAR_WEEKS} weeks`,
  ];
  byId('legend').replaceChildren(...entries.map((text) => el('span', { text })));
}
