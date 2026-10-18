// JSON access to Web Storage. Storage can be missing, blocked or full, so
// every access is guarded: load falls back to a default, save reports failure.

/**
 * @typedef {object} JsonStorage
 * @property {(key: string, fallback: unknown) => unknown} load
 * @property {(key: string, value: unknown) => boolean} save  false if the write failed
 */

/**
 * @param {() => Pick<Storage, 'getItem'|'setItem'>} getBackend
 *   called on each access, because merely reading window.localStorage can throw
 * @returns {JsonStorage}
 */
export function createStorage(getBackend = () => window.localStorage) {
  return {
    load(key, fallback) {
      try {
        const raw = getBackend().getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    save(key, value) {
      try {
        getBackend().setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };
}
