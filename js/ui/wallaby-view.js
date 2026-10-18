// The wallaby on the main page: greets the user when the page opens.

import { greeting } from '../motivation.js';
import { byId } from './dom.js';

/**
 * @param {import('../store.js').Store} store
 * @param {() => Date} [now]
 */
export function initWallabyView(store, now = () => new Date()) {
  const box = byId('wb-home');
  byId('wb-home-text').textContent = greeting(store.state.log, now());
  byId('wb-close').addEventListener('click', () => {
    box.hidden = true;
  });
}
