import type { ZodSchema } from 'zod';

const STORAGE_PREFIX = 'kijk-';

/** A simple wrapper around the browser's local/session storage. */
export const browserStorage = {
  /**
   * Get an item from the storage. The item will be parsed from JSON and validated using the provided schema.
   *
   * @param key The key to store the item under.
   * @param schema The schema to validate the item against.
   * @param storage The storage to use (localStorage or sessionStorage).
   * @returns The parsed item or undefined if the item is not found or invalid.
   */
  getItem<T>(key: string, schema?: ZodSchema<T>, storage: Storage = localStorage) {
    const value = storage.getItem(STORAGE_PREFIX + key);
    if (value === null) {
      return;
    }
    const parsed = JSON.parse(value) as T;
    if (schema) {
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        return;
      }
      return validation.data;
    }
    return parsed;
  },

  /**
   * Set an item in the storage with a given key. The item will be serialized to JSON before being stored.
   *
   * @param key The key to store the item under.
   * @param item The item to store.
   * @param storage The storage to use (localStorage or sessionStorage).
   */
  setItem<T>(key: string, item: T, storage: Storage = localStorage) {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(item));
  },

  /**
   * Check if an item exists in the storage with a given key. The item will be validated using the provided validator
   * function.
   *
   * @param key The key to store the item under.
   * @param item The item to store.
   * @param storage The storage to use (localStorage or sessionStorage).
   * @returns
   */
  hasItem(key: string, storage: Storage = localStorage) {
    return storage.getItem(STORAGE_PREFIX + key) !== null;
  },

  /**
   * Remove an item from the storage with a given key.
   *
   * @param key The key to store the item under.
   * @param storage The storage to use (localStorage or sessionStorage).
   */
  removeItem(key: string, storage: Storage = localStorage) {
    storage.removeItem(STORAGE_PREFIX + key);
  },

  /**
   * Clear the storage.
   *
   * @param storage The storage to use (localStorage or sessionStorage).
   */
  clear(storage: Storage = localStorage) {
    storage.clear();
  },
};
