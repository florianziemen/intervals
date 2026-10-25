// The wallaby on the main page: greets the user when the page opens.

import { fightState } from '../fight.js';
import { greeting } from '../motivation.js';
import { byId, showWally } from './dom.js';

/**
 * @param {import('../store.js').Store} store
 * @param {() => Date} [now]
 */
export function initWallabyView(store, now = () => new Date()) {
  const box = byId('wb-home');
  showWally(box, fightState(store.state.log, now()).zombie);
  byId('wb-home-text').textContent = greeting(store.state.log, now());
  byId('wb-close').addEventListener('click', () => {
    box.hidden = true;
  });
}
