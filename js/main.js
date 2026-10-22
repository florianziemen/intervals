// Entry point: wires storage, state, feedback and views together.

import { createFeedback } from './feedback.js';
import { createStorage } from './storage.js';
import { createStore } from './store.js';
import { initBackupView } from './ui/backup-view.js';
import { initFightView } from './ui/fight-view.js';
import { initGroupsView } from './ui/groups-view.js';
import { initHistoryView } from './ui/history-view.js';
import { initSettingsView } from './ui/settings-view.js';
import { initTimerView } from './ui/timer-view.js';
import { initWallabyView } from './ui/wallaby-view.js';

const store = createStore(createStorage());
const feedback = createFeedback(() => store.state.settings.sound);

initWallabyView(store);
initSettingsView(store);
initGroupsView(store);
initHistoryView(store);
initFightView(store);
initTimerView(store, feedback);
initBackupView(store);

// Offline support. Service workers need a secure context.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// Ask the browser not to clear this site's storage when space runs low.
navigator.storage?.persist?.().catch(() => {});
