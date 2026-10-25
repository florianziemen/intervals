// Wally vs the zombies: his gear slots and status under the calendar.

import { MAX_LEVEL, TRAITS, fightLine, fightState } from '../fight.js';
import { activeSeason } from '../seasons.js';
import { byId, el, showWally } from './dom.js';

/**
 * @param {import('../store.js').Store} store
 * @param {() => Date} [now]
 */
export function initFightView(store, now = () => new Date()) {
  const box = byId('fight');
  const slots = byId('f-slots');
  const text = byId('f-text');

  function render() {
    const state = fightState(store.state.log, now());
    showWally(box, state.zombie, activeSeason(now())?.outfit);
    slots.replaceChildren(
      ...TRAITS.map((t, i) => {
        const has = i < state.traits.length;
        return el('span', {
          className: has ? 'slot on' : 'slot',
          text: has ? t.emoji : '',
          attrs: { title: has ? t.name : 'not found yet' },
        });
      }),
    );
    slots.setAttribute(
      'aria-label',
      state.traits.length
        ? `Gear ${state.traits.length} of ${MAX_LEVEL}: ${state.traits.map((t) => t.name).join(', ')}`
        : `No gear, 0 of ${MAX_LEVEL}`,
    );
    text.textContent = fightLine(state);
  }

  store.subscribe(render);
  render();
}
