# AGENTS.txt — Intervals (HIIT timer and workout log)

Guide for AI coding agents and human contributors working on this repo.

## What this is

Intervals is a mobile-first HIIT interval timer with an on-device workout log.
It is a static web app hosted on GitHub Pages and installable to the home
screen as a PWA. There is no server, no build step and no dependencies.

## Core principles (do not break these)

1. Privacy: the app never sends user data anywhere. No analytics, no
   trackers, no third-party requests of any kind. That includes CDNs, web
   fonts, remote images and external APIs. All data lives in the browser's
   localStorage on the user's phone.
2. Single file: all HTML, CSS and JS live inline in index.html. Do not add
   frameworks, bundlers, npm packages or external scripts.
3. Offline first: everything the app needs must be listed in sw.js so it
   works with no connection.
4. Mobile first: the primary target is a phone held in one hand during a
   workout. Tap targets are at least 44px and text is large and high contrast.
5. Backward compatibility: existing users have logs in localStorage and
   backups in their notes. Never break reading old data (see "Data model").

## Project layout

    index.html              The whole app: markup, <style>, and one <script> IIFE
    sw.js                   Service worker: offline cache (cache first, refresh in background)
    manifest.webmanifest    PWA manifest: name, colors, icons, standalone display
    icon-192.png            App icon (purpose "any")
    icon-512.png            App icon (purpose "any")
    icon-maskable-512.png   Android adaptive icon, artwork inside the central safe zone
    apple-touch-icon.png    iOS home-screen icon (180x180)
    wallaby-logo.svg        Logo artwork without background (also inlined in index.html header)
    LICENSE                 MIT
    AGENTS.txt              This file

All paths are relative ("./", "sw.js", "icon-192.png") because the site is
served from a subpath (https://<user>.github.io/<repo>/). Never use
root-absolute paths like "/sw.js".

## Hosting and deployment

- GitHub Pages deploys from branch main, folder / (root). Pushing to main
  is the release.
- After changing any cached file, bump the CACHE constant in sw.js
  (intervals-v2 -> intervals-v3). This makes installed apps re-download
  everything. If you add a new file the app needs, add it to the FILES
  list in sw.js as well.
- Users see updates on the second launch after a deploy, because the
  service worker serves the cached copy first and refreshes it in the
  background.
- On iOS, a home-screen app has its own storage, separate from Safari.

## Data model (localStorage)

All reads and writes go through load(key, default) and store(key, value).
Both wrap storage access in try/catch, because storage can be unavailable
or full. Always validate and sanitize what you read.

hiit-settings-v1: object
    work      seconds per work interval      5..300   (stepper +/-5)
    rest      seconds between rounds         0..300   (stepper +/-5)
    rounds    rounds per set                 1..50
    sets      times the round sequence runs  1..10
    setRest   break between sets, seconds    0..600   (stepper +/-15; 0 = use normal rest)
    sound     boolean, beeps and vibration
    group     id of the selected exercise group, or null
    Limits live in the LIM object. Defaults are applied per field when invalid.

hiit-groups-v1: array of
    { id: string, name: string (max 40), exercises: string[] (1..30, each max 40) }
    cleanGroup() validates a group. It is used on load and on restore.

hiit-log-v1: array of workout sessions
    { id: string,
      at: ISO 8601 timestamp of when the workout ended,
      work, rest: seconds,
      rounds: number of COMPLETED work intervals in total (across all sets),
      planned: rounds * sets that were planned,
      sets?: number (only stored when > 1),
      group?: group NAME at the time (a snapshot, not an id) }
    Exercise time for a session = work * rounds (work intervals only, no rest).
    A session is only logged if at least one work interval was completed.

Backup format (Back up or restore panel, shown as text and copied to the clipboard):
    { "app": "intervals", "version": 2, "workouts": [...], "groups": [...] }
    Restore also accepts a bare array of workouts (old format). It merges by
    id and never overwrites or deletes existing entries.

Changing the schema: add optional fields with safe defaults rather than
renaming keys. If a breaking change is unavoidable, write a migration that
reads the old key, converts it, writes the new one and keeps the old data
until the conversion succeeds. Bump the backup "version" and keep restore
able to read every older version.

## Main concepts in index.html

Settings and groups
- renderSettings() updates the steppers and the start button, saves the
  settings and calls renderGroups().
- Selecting a group sets rounds to its number of exercises. Work intervals
  are labeled exercises[(round - 1) % length], starting over in each set.
- The group editor uses one exercise per line in a textarea. Deleting a
  group takes two taps.

Timer
- build() creates a flat list of phases: prep (5s), then for each set the
  work and rest phases, with a "break" phase between sets. If setRest is 0,
  a normal rest phase is used between sets instead, when rest > 0.
- Phase objects: { type: 'prep'|'work'|'rest'|'break', dur, set, round, label? }
- Timing is based on timestamps (performance.now and phaseEnd), not on
  counting ticks. update() runs every 100ms and catches up across several
  phases if the page was in the background.
- Pausing stores the remaining milliseconds, and resuming moves phaseEnd
  forward. pausedTotal keeps the elapsed-time display correct.
- Beeps use WebAudio (the AudioContext is created on the start tap, as iOS
  requires), vibration uses navigator.vibrate, and the Screen Wake Lock is
  requested at start and again when the page becomes visible.
- finish(full) writes the session to the log. Ending early takes two taps.
- Overlay colors by phase: work = --work (cobalt), rest = --rest (yellow),
  prep and break = --prep.

History
- Stats: sessions this week (weeks start Monday), weeks in a row with at
  least one session, and work minutes over the last 30 days.
- Calendar: the last 6 weeks, Monday to Sunday, one row per week. Each day
  shows its date, an emoji and its exercise time (m:ss).
- Emoji tiers by daily work time (TIERS): 🐢 under 5 min, 🐇 5–10,
  🦊 10–15, 🐆 15–25, 🦁 25+. 🦘 marks the day(s) with the most exercise
  time in the visible 6 weeks (ties all get it). 🧟 marks past days with
  no exercise. Today stays blank until a workout is logged.
- Tapping a day shows its details in #daydetail. The recent workouts list
  shows the latest 25 sessions, and deleting one takes two taps.

PWA bits
- The service worker registers only on https or localhost.
- navigator.storage.persist() is requested so the browser is less likely
  to clear storage.

## Coding conventions

- Plain JavaScript inside one IIFE, in the existing style (var, function
  declarations, no modules). It must run in current iOS Safari and Android
  Chrome without transpiling.
- Put user-entered text into the page with textContent, never with
  innerHTML (group names, exercise names, restored backups).
- Don't use alert(), confirm() or prompt(). Destructive actions use the
  existing two-tap pattern: the first tap arms the button for 3 seconds,
  the second confirms.
- Colors come from CSS custom properties on :root. Light and dark values
  are defined under prefers-color-scheme and [data-theme]. Add new colors
  as tokens in all three places, never as hard-coded values in components.
- Respect safe areas (env(safe-area-inset-*)) and keep the timer overlay
  full-screen.
- UI text uses typographic apostrophes and quotes (’ “ ”). Code keeps
  straight quotes.
- Keep interactive elements as <button> with clear aria-labels where the
  visible text is not enough.

## Testing

There is no automated test suite. Before committing:
1. Check the syntax by extracting the <script> from index.html and running
   node --check on it. Also run node --check sw.js, and validate
   manifest.webmanifest as JSON.
2. Serve locally with python3 -m http.server and open
   http://localhost:8000. The service worker also registers on localhost.
3. Manual checks: start, pause, resume and end a workout. Run with
   sets > 1 and a break, with rest 0, and with a group selected. Confirm
   the session appears in the calendar and the list. Back up, clear
   storage, then restore. Check dark mode, and check that it loads
   offline after the first visit.
4. If possible, test on a real iPhone (Safari and the home-screen app) and
   an Android phone (Chrome).

## Out of scope unless the owner asks

Accounts, sync, cloud storage, analytics, sharing features, external
libraries or fonts, and anything that sends data off the device.
