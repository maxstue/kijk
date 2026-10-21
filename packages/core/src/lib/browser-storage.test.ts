import { expect, test, vi } from 'vite-plus/test';
import { z } from 'zod';

import { browserStorage } from './browser-storage';

function createStorage() {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  } satisfies Storage;
}

test('persists structured values and removes them without affecting other keys', () => {
  const storage = createStorage();
  browserStorage.setItem('theme', { mode: 'dark' }, storage);
  browserStorage.setItem('other', 42, storage);
  expect(browserStorage.getItem('theme', undefined, storage)).toEqual({ mode: 'dark' });
  expect(browserStorage.hasItem('theme', storage)).toBe(true);
  browserStorage.removeItem('theme', storage);
  expect(browserStorage.hasItem('theme', storage)).toBe(false);
  expect(browserStorage.getItem('theme', undefined, storage)).toBeUndefined();
  expect(browserStorage.getItem('other', undefined, storage)).toBe(42);
  browserStorage.clear(storage);
  expect(storage.length).toBe(0);
});

test('validates stored values and returns the schema-transformed result', () => {
  const storage = createStorage();
  browserStorage.setItem('amount', '42', storage);
  expect(browserStorage.getItem('amount', z.coerce.number(), storage)).toBe(42);
  expect(browserStorage.getItem('amount', z.object({ amount: z.number() }), storage)).toBeUndefined();
});

test('namespaces keys and uses local storage by default', () => {
  const storage = createStorage();
  vi.stubGlobal('localStorage', storage);
  try {
    browserStorage.setItem('preference', true);
    expect(storage.getItem('kijk-preference')).toBe('true');
    expect(browserStorage.getItem('preference')).toBe(true);
    expect(browserStorage.hasItem('preference')).toBe(true);
    browserStorage.removeItem('preference');
    expect(browserStorage.hasItem('preference')).toBe(false);
    browserStorage.setItem('another', false);
    browserStorage.clear();
    expect(storage.length).toBe(0);
  } finally {
    vi.unstubAllGlobals();
  }
});
