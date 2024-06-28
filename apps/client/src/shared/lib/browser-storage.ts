const STORAGE_PREFIX = 'kijk-';

// REFACTOR: use zod and simplify

/** A simple wrapper around the browser's local/session storage. */
export const browserStorage = {
  getItem<T>(key: string, storage: Storage = localStorage) {
    const value = storage.getItem(STORAGE_PREFIX + key);
    if (value === null) {
      return undefined;
    }
    return JSON.parse(value) as T;
  },

  setItem<T>(key: string, item: T, storage: Storage = localStorage) {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(item));
  },

  hasItem(key: string, storage: Storage = localStorage, validator?: (value: string) => boolean) {
    const arr = this.getItem(key, storage);
    if (validator && arr != null) {
      return validator(arr as string);
    }
    return arr != null;
  },

  removeItem(key: string, storage: Storage = localStorage) {
    storage.removeItem(STORAGE_PREFIX + key);
  },

  clear(storage: Storage = localStorage) {
    storage.clear();
  },
};
