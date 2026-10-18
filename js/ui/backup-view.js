// Back up or restore panel: backup text, clipboard copy, merge restore.

import { count } from '../format.js';
import { byId } from './dom.js';

/** @param {import('../store.js').Store} store */
export function initBackupView(store) {
  const text = /** @type {HTMLTextAreaElement} */ (byId('backupText'));
  const msg = byId('backupMsg');
  /** @param {string} t */
  const say = (t) => {
    msg.textContent = t;
  };

  byId('showBackup').addEventListener('click', () => {
    text.value = store.backup();
    say(`${count(store.state.log.length, 'workout')} in this backup. Copy it to keep it safe.`);
  });

  byId('copyBackup').addEventListener('click', () => {
    text.value = store.backup();
    const done = () => say('Backup copied. Paste it into a note to keep it.');
    const fallback = () => {
      text.focus();
      text.select();
      try {
        // Deprecated, but the only option where the async Clipboard API is missing.
        if (document.execCommand('copy')) return done();
      } catch {
        // Fall through to the manual hint.
      }
      say('Select the text above and copy it.');
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text.value).then(done, fallback);
    else fallback();
  });

  byId('restore').addEventListener('click', () => {
    const raw = text.value.trim();
    if (!raw) {
      say('Paste a backup into the box first.');
      return;
    }
    let added;
    try {
      added = store.restore(raw);
    } catch {
      say('That text isn’t a backup from this tracker. Check that you pasted all of it.');
      return;
    }
    say(
      added.workouts || added.groups
        ? `Restored ${count(added.workouts, 'workout')} and ${count(added.groups, 'group')}.`
        : 'Nothing new to restore. Everything in that backup is already here.',
    );
  });
}
