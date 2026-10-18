// Start button, steppers, presets and the sound toggle.

import { breakLength, clock, short } from '../format.js';
import { workoutSeconds } from '../settings.js';
import { byId } from './dom.js';

/** @param {import('../store.js').Store} store */
export function initSettingsView(store) {
  const sound = byId('sound');

  for (const b of document.querySelectorAll('.stepper button')) {
    const btn = /** @type {HTMLButtonElement} */ (b);
    const field = /** @type {import('../settings.js').NumericField} */ (btn.dataset.f);
    const delta = Number(btn.dataset.d);
    btn.addEventListener('click', () => {
      store.updateSettings({ [field]: store.state.settings[field] + delta });
    });
  }

  for (const b of document.querySelectorAll('[data-preset]')) {
    const [work, rest, rounds] = /** @type {HTMLElement} */ (b).dataset.preset.split(',').map(Number);
    b.addEventListener('click', () => store.updateSettings({ work, rest, rounds }));
  }

  sound.addEventListener('change', () => {
    store.updateSettings({ sound: /** @type {HTMLInputElement} */ (sound).checked });
  });

  function render() {
    const s = store.state.settings;
    const multi = s.sets > 1;
    const group = store.currentGroup();

    byId('o-work').textContent = short(s.work);
    byId('o-rest').textContent = s.rest ? short(s.rest) : 'none';
    byId('o-rounds').textContent = String(s.rounds);
    byId('o-sets').textContent = String(s.sets);
    byId('o-setRest').textContent = s.setRest ? breakLength(s.setRest) : 'none';
    byId('breakRow').classList.toggle('dim', !multi);

    const big = byId('startBig');
    big.textContent = `${multi ? `${s.sets} × ` : ''}${s.rounds} × ${short(s.work)}`;
    big.classList.toggle('compact', multi);

    const parts = [];
    if (group) parts.push(group.name);
    if (multi) {
      const brk = s.setRest ? `${breakLength(s.setRest)} break` : 'no extra break';
      parts.push(`${s.sets} sets of ${s.rounds}, ${brk}`);
    }
    parts.push(s.rest ? `${short(s.rest)} rest` : 'No rest');
    parts.push(`${clock(workoutSeconds(s))} total`, 'tap to start');
    byId('startSub').textContent = parts.join(' · ');

    /** @type {HTMLInputElement} */ (sound).checked = s.sound;
  }

  store.subscribe(render);
  render();
}
