// Beeps (WebAudio), vibration and the screen wake lock. All of these are
// optional browser features, so every call fails silently.

/** Peak beep gain (1 = full scale). */
const VOLUME = 1;

/** @param {() => boolean} isEnabled  whether beeps and vibration are on */
export function createFeedback(isEnabled) {
  /** @type {AudioContext|null} */
  let audio = null;
  /** @type {WakeLockSentinel|null} */
  let lock = null;

  return {
    /** Create or resume audio. iOS only allows this inside a user gesture. */
    unlockAudio() {
      try {
        // @ts-ignore webkitAudioContext is older Safari
        audio ??= new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === 'suspended') audio.resume();
      } catch {
        audio = null;
      }
    },

    /**
     * @param {number} freq  Hz
     * @param {number} dur   seconds
     */
    beep(freq, dur) {
      if (!isEnabled() || !audio) return;
      try {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audio.destination);
        // Full level, held for most of the beep, then a short fade to avoid a click.
        const t = audio.currentTime;
        const fade = Math.min(0.05, dur / 3);
        gain.gain.setValueAtTime(VOLUME, t);
        gain.gain.setValueAtTime(VOLUME, t + dur - fade);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t);
        osc.stop(t + dur);
      } catch {
        // Audio is a nice-to-have.
      }
    },

    /** @param {number|number[]} pattern  milliseconds */
    buzz(pattern) {
      if (!isEnabled() || !navigator.vibrate) return;
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration is a nice-to-have.
      }
    },

    keepAwake() {
      if (!('wakeLock' in navigator)) return;
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          lock = l;
        })
        .catch(() => {});
    },

    releaseAwake() {
      lock?.release().catch(() => {});
      lock = null;
    },
  };
}

/** @typedef {ReturnType<typeof createFeedback>} Feedback */
