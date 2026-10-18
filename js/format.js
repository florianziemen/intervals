// Text formatting helpers for durations and counts.

/** Seconds as "m:ss", e.g. 95 -> "1:35". Negative values show as 0:00. */
export function clock(sec) {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Compact duration: whole minutes as "2m", everything else as "45s". */
export function short(sec) {
  return sec >= 60 && sec % 60 === 0 ? `${sec / 60}m` : `${sec}s`;
}

/** Break length: "45s" below a minute, "m:ss" from a minute up. */
export function breakLength(sec) {
  return sec >= 60 ? clock(sec) : `${sec}s`;
}

/** Spoken-style duration, e.g. 125 -> "2 min 5 s". */
export function long(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (!m) return `${s} s`;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** "1 round", "3 rounds". */
export function count(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}
