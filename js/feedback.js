// Beeps (WebAudio), vibration and the screen wake lock. All of these are
// optional browser features, so every call fails silently.

/** Peak beep gain (1 = full scale). */
const VOLUME = 1;

/** @param {() => boolean} isEnabled  whether beeps and vibration are on */
export function createFeedback(isEnabled) {
  /** @type {AudioContext|null} */
  let audio = null;
  /** true after the page was hidden: iOS may have silently broken the context */
  let stale = false;
  /** @type {WakeLockSentinel|null} */
  let lock = null;

  // Ambient audio mixes with music from other apps instead of stopping it
  // (Safari 16.4+; elsewhere the default already behaves this way).
  try {
    // @ts-ignore audioSession is Safari only
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
  } catch {
    // Not supported.
  }

  return {
    /**
     * Create or resume audio. Call it from a tap: iOS only starts audio
     * inside a user gesture. After the app was in the background (or a call,
     * Siri or another app took the audio session) the old context can stay
     * silent even when it reports "running", so it is replaced.
     */
    unlockAudio() {
      try {
        // "interrupted" is Safari's state while another app holds the audio.
        if (audio && (stale || audio.state === 'closed' || audio.state === 'interrupted')) {
          audio.close().catch(() => {});
          audio = null;
        }
        // @ts-ignore webkitAudioContext is older Safari
        audio ??= new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state !== 'running') audio.resume().catch(() => {});
        stale = false;
      } catch {
        audio = null;
      }
    },

    /**
     * Try to restart audio without a tap, e.g. when the page becomes visible
     * again. iOS allows this after an interruption ends; if it doesn't, the
     * next tap fixes it through unlockAudio().
     * @param {boolean} visible
     */
    pageVisible(visible) {
      if (!visible) {
        stale = true;
        return;
      }
      if (audio && audio.state !== 'running') audio.resume().catch(() => {});
    },

    /**
     * @param {number} freq  Hz
     * @param {number} dur   seconds
     */
    beep(freq, dur) {
      if (!isEnabled() || !audio) return;
      try {
        if (audio.state !== 'running') audio.resume().catch(() => {});
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
