import { clsx } from 'clsx';
import { Draft } from 'immer';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';
import { create, StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { env } from '@/env';
import { Months, months, Optional } from '@/types/app';
import { AppError } from '@/types/errors';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const initialRegex = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');

export function getInitailChars(stringValue: Optional<string>) {
  if (!stringValue) {
    return 'KJ';
  }
  const initials = [...stringValue.matchAll(initialRegex)] || [];

  return ((initials.shift()?.[1] ?? '') + (initials.pop()?.[1] ?? '')).toUpperCase();
}

/**
 * Example: class CustomError extends Error { data: Record<string, unknown>; constructor(message: string, data:
 * Record<string, unknown>) { super(message); this.data = data; } }
 *
 * Try { // do some stuff } catch (thrown) { let error = asError(thrown); if (error instanceof CustomError) {
 * console.error(error.data); return; } throw thrown; }
 *
 * @param thrown Error which is thrown
 * @returns Typesafe error
 */
export const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    // fallback in case there's an error stringifying.
    // for example, due to circular references.
    return new Error(String(thrown));
  }
};

type TypeToZodShape<T> = [T] extends [string | number | boolean | undefined | null]
  ? z.Schema<T>
  : { [K in keyof T]: TypeToZodShape<T[K]> };

/**
 * A function that creates zod schemas from your own interfaces, with full autocomplete.
 *
 * @returns A typesafe zod schema based on the interface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodBuilder<TType extends Record<string, any>>() {
  return <TShape extends TypeToZodShape<TType>>(shape: TShape): z.ZodObject<TType> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return z.object(shape as any) as any;
  };
}

export function formatStringToCurrency(value: string | number) {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatStringDateToOnlyDateString(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const day = `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}`;
  const month = `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}`;

  return year + '-' + month + '-' + day;
}

export function getMonthIndexFromString(month: string) {
  if (isMonth(month)) {
    return months.indexOf(month) + 1;
  }
  throw new AppError({ type: 'VALIDATION', message: `The given string "${month}" is not a valid month` });
}

const isMonth = (b: string): b is Months => {
  return months.includes(b as Months);
};

type ImmerSetter<T extends object> = (
  nextStateOrUpdater: T | Partial<T> | ((state: Draft<T>) => void),
  shouldReplace?: boolean | undefined,
  actionType?:
    | string
    | {
        type: string;
      }
    | undefined,
) => void;

/**
 * Creates a new zustand store with middlwares. middlewares: immer, devtools devtools are disabled in prod build
 *
 * @param storeName The store name
 * @param store The zustand store
 * @returns A newly created store with all middlewares applied
 */
export const createStoreFactory = <T extends object>(
  storeName: string,
  store: (set: ImmerSetter<T>, get: StoreApi<T>['getState']) => T,
) => create<T>()(devtools(immer(store), { store: `kijk/${storeName}`, name: 'kijk', enabled: env.DevToolsLogger }));

const STORAGE_PREFIX = 'kijk-';

// REFACTOR: use zod and simplify
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

/**
 * Groups a list by the given property and allows to specify a uniqueProperty to check for duplicates.
 *
 * @param listToGroup The list to group.
 * @param property The property to group by.
 * @param uniqueProperty The property to check by.
 * @returns Returns an object with n-amount of lists as type "RT"
 */
export const groupBy = <T, RT extends Record<string | number | symbol, T[]>>(
  listToGroup: T[],
  getKey: (item: T) => string,
  getUniqueKey?: (item: T) => string,
) => {
  if (listToGroup) {
    return listToGroup.reduce(
      (previous, obj) => {
        const copyOfPrevious = previous;
        const group = getKey(obj);
        if (!copyOfPrevious[group]) {
          copyOfPrevious[group] = [];
        }

        if (Array.isArray(copyOfPrevious[group])) {
          if (getUniqueKey != null) {
            const foundIndex = previous[group].findIndex((x) => getUniqueKey(x) === getUniqueKey(obj));
            if (foundIndex === -1) {
              copyOfPrevious[group].push(obj);
            }
          } else {
            copyOfPrevious[group].push(obj);
          }
        }

        return copyOfPrevious;
      },
      {} as Record<string, T[]>,
    ) as RT;
  }
  return {} as Record<string, T[]> as RT;
};
