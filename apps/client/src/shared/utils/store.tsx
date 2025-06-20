import { createContext, useContext, useState } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Draft } from 'immer';
import type { StoreApi } from 'zustand/vanilla';

import { env } from '@/shared/env';

type ImmerSetter<T extends object> = (
  nextStateOrUpdater:
    | Exclude<T, (...args: Array<unknown>) => unknown>
    | Partial<Exclude<T, (...args: Array<unknown>) => unknown>>
    | ((state: Draft<Exclude<T, (...args: Array<unknown>) => unknown>>) => void),
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
) => create<T>()(devtools(immer(store), { store: `kijk/${storeName}`, name: 'kijk', enabled: env.DevToolsLogger }));

/**
 * Create a zustand store inside a react context. This way you can use the store per feature, component, etc and don't
 * make it globally available
 *
 * Example: type State = { bears: number; increasePopulation: (num: number) => void; };
 *
 * Const BearStuff = createZustandContext( (initialState: { bears: number }) => { return createStore<State>()((set) =>
 * ({ bears: initialState.bears, increasePopulation: (by) => set((state) => ({ bears: state.bears + by, })), })); }, );
 *
 * Const App = () => { return ( <BearStuff.Provider initialValue={{ bears: 1, }} > My App </BearStuff.Provider> ); };
 *
 * @param getStore The initial store
 * @returns The
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createZustandContext = <TInitial, TStore extends StoreApi<any>>(
  getStore: (initial: TInitial) => TStore,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Context = createContext(undefined as any as TStore);

  const Provider = (props: { children?: React.ReactNode; initialValue: TInitial }) => {
    const [store] = useState(() => getStore(props.initialValue));

    return <Context.Provider value={store}>{props.children}</Context.Provider>;
  };

  return {
    useContext: () => useContext(Context),
    Context,
    Provider,
  };
};
