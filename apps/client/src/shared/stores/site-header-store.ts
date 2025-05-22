import type { StoreApi, UseBoundStore } from 'zustand';

import { createStoreFactory } from '@/shared/utils/store';
import { capitalizeFirstLetter } from '@/shared/utils/string';

interface State {
  title: string | undefined;
  actions: {
    setTitle: (newTitle: string) => void;
  };
}

const siteHeaderStore = createStoreFactory<State>('theme-store', (set) => ({
  title: 'Kijk',
  actions: {
    setTitle(newTitle) {
      set((state) => {
        state.title = capitalizeFirstLetter(newTitle);
      });
    },
  },
}));

export const useSiteHeaderStore = siteHeaderStore as UseBoundStore<StoreApi<Omit<State, 'actions'>>>;
export const useSiteHeaderStoreActions = () => siteHeaderStore((state) => state.actions);
