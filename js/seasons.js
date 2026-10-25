// Seasonal occasions: Wally's extra lines and outfit around holidays and
// events, mostly seen from back home in Australia. Ranges never overlap,
// so at most one season is active on any day.

/**
 * @typedef {object} Season
 * @property {string} key
 * @property {(now: Date) => boolean} active  true on the local days it runs
 * @property {string} outfit   overlay drawn on Wally, file in outfits/
 * @property {readonly string[]} greetings
 * @property {readonly string[]} cheers
 */

/** @param {Date} d */
const dayNumber = (d) => (d.getMonth() + 1) * 100 + d.getDate();

/**
 * Active from month/day `from` to `to`, both inclusive, within one year.
 * @param {number} from  month * 100 + day, e.g. 1224
 * @param {number} to
 */
const between = (from, to) => (/** @type {Date} */ now) => {
  const n = dayNumber(now);
  return n >= from && n <= to;
};

/**
 * Easter Sunday (Gregorian), anonymous algorithm.
 * @param {number} year
 * @returns {Date} local midnight
 */
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Good Friday to Easter Monday, both public holidays in Australia. @param {Date} now */
function easterWeekend(now) {
  const sunday = easterSunday(now.getFullYear());
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((day.getTime() - sunday.getTime()) / 86_400_000);
  return diff >= -2 && diff <= 1;
}

/** @type {readonly Season[]} */
export const SEASONS = Object.freeze([
  {
    key: 'newYear',
    active: between(101, 107),
    outfit: 'party-hat',
    greetings: [
      'New year, new wannabe. Let’s make it a wallaby.',
      'Resolutions are for wannabes. Workouts are for wallabies.',
      'Happy New Year! Still keen? Let’s keep it that way.',
      'Fresh year, empty calendar. Let’s start filling it.',
    ],
    cheers: [
      'Resolution kept. Today, anyway.',
      'That’s how you start a year!',
      'Happy New Year! Fireworks, but for your legs.',
    ],
  },
  {
    key: 'mardiGras',
    active: between(214, 307),
    outfit: 'rainbow',
    greetings: [
      'Mardi Gras time back home in Sydney! Let’s hop with pride.',
      'All of Oxford Street is dancing. We can at least hop.',
      'Parade fitness starts here.',
    ],
    cheers: [
      'Fabulous! Proper parade stamina, that.',
      'You shone like a float on Oxford Street.',
      'Proud of you. Very on theme for Mardi Gras.',
    ],
  },
  {
    key: 'easter',
    active: easterWeekend,
    outfit: 'easter-eggs',
    greetings: [
      'Happy Easter! Back home the Easter Bilby brings the eggs.',
      'The Easter Bunny gets all the fame. The Bilby does the work.',
      'Eggs later. Hops now.',
      'Long weekend! Plenty of time for a quick one.',
    ],
    cheers: [
      'You’ve earned a chocolate egg. A small one.',
      'The Easter Bilby would be proud.',
      'Egg-cellent. Sorry, had to.',
    ],
  },
  {
    key: 'pride',
    active: between(601, 630),
    outfit: 'rainbow',
    greetings: [
      'Happy Pride! Be who you want to be. Wallaby is also an option.',
      'Pride month! Back home we have Mardi Gras, but I’ll happily celebrate twice.',
      'Love is love. Rounds are rounds. Let’s go.',
    ],
    cheers: [
      'Proud of you. Very on theme.',
      'Strong, proud and done. Happy Pride!',
      'Every colour of the rainbow, and every round.',
    ],
  },
  {
    key: 'magpies',
    active: between(901, 930),
    outfit: 'helmet',
    greetings: [
      'Swooping season back home. Magpies, not zombies. Both scary.',
      'Spring in Oz means magpies. Good thing I’ve got a helmet.',
      'Cable ties on the helmet, and off we go.',
      'Best defence against magpies? Being quick. Let’s train.',
    ],
    cheers: ['Too fast for any magpie.', 'Not a single swoop. Well done.', 'Outran the magpies again!'],
  },
  {
    key: 'halloween',
    active: between(1024, 1031),
    outfit: 'witch-hat',
    greetings: [
      'Halloween? Back home it’s spring. But the zombies are real all year.',
      'Nice costume. Oh, that’s just you? Let’s work out anyway.',
      'Trick or treat? Trick: a workout. Treat: after the workout.',
      'I’m not dressing up as a zombie. I’ve been one. Not fun.',
    ],
    cheers: [
      'Sweet as! You’ve earned a treat. One.',
      'Scarier than any zombie. Well done.',
      'Zombies hate this one trick: exercise.',
    ],
  },
  {
    key: 'christmas',
    active: between(1220, 1225),
    outfit: 'santa-hat',
    greetings: [
      'Christmas back home means the beach. Here, a workout will do.',
      'Prawns on the barbie later. Rounds first.',
      'Room for pudding? Let’s make some.',
      'Even Santa does cardio. All those chimneys.',
    ],
    cheers: [
      'Merry Christmas, mate! That’s a present to yourself.',
      'Ho ho hop! Brilliant.',
      'Now you’ve earned the pav.',
    ],
  },
  {
    key: 'boxingDay',
    active: between(1226, 1230),
    outfit: 'cricket',
    greetings: [
      'The Boxing Day Test is on. Let’s get some runs on the board.',
      'Slip, slop, slap, and stretch.',
      'Cricket on the telly? Watch an over, then do a round.',
      'Leftovers can wait. Let’s bat first.',
    ],
    cheers: [
      'That’s a six! Right out of the MCG.',
      'Not out, and still batting. Top innings.',
      'Tea break earned.',
    ],
  },
]);

/**
 * The season running on the local day of `now`, if any.
 * @param {Date} now
 * @returns {Season|undefined}
 */
export function activeSeason(now) {
  return SEASONS.find((s) => s.active(now));
}
