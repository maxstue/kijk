import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Draft } from 'immer';
import type { StoreApi } from 'zustand/vanilla';

type ImmerSetter<T extends object> = (
  nextStateOrUpdater:
    | Exclude<T, (...args: unknown[]) => unknown>
    | Partial<Exclude<T, (...args: unknown[]) => unknown>>
    | ((state: Draft<Exclude<T, (...args: unknown[]) => unknown>>) => void),
  shouldReplace?: false,
  actionType?:
    | string
    | {
        type: string;
      },
) => void;

/**
 * Creates a new zustand store with middlewares. middlewares: immer, devtools devtools are disabled in prod build
 *
 * @param storeName The store name
 * @param store The zustand store
 * @returns A newly created store with all middlewares applied
 */
export const createStoreFactory = <T extends object>(
  storeName: string,
  store: (set: ImmerSetter<T>, get: StoreApi<T>['getState']) => T,
  enableLogger: boolean = false,
) => create<T>()(devtools(immer(store), { store: `kijk/${storeName}`, name: 'kijk', enabled: enableLogger }));
