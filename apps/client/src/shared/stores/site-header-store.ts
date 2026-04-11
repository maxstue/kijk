import { createStoreFactory } from '@kijk/core/utils/store';
import type { StoreApi, UseBoundStore } from 'zustand';

import { capitalizeFirstLetter } from '@/shared/utils/string';

interface State {
  title: string | undefined;
  actions: {
    setTitle: (newTitle: string) => void;
  };
}

const siteHeaderStore = createStoreFactory<State>('theme-store', (set) => ({
  actions: {
    setTitle(newTitle) {
      set((state) => {
        state.title = capitalizeFirstLetter(newTitle);
      });
    },
  },
  title: 'Kijk',
}));

export const useSiteHeaderStore = siteHeaderStore as UseBoundStore<StoreApi<Omit<State, 'actions'>>>;
export const useSiteHeaderStoreActions = () => siteHeaderStore((state) => state.actions);
