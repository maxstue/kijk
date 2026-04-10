import { browserStorage } from '@kijk/core/lib/browser-storage';
import { themeStorageKey } from '@kijk/core/lib/constants';
import { createStoreFactory } from '@kijk/core/utils/store';
import type { ToasterProps } from 'sonner';
import type { StoreApi, UseBoundStore } from 'zustand';

interface Storage {
  mode: ToasterProps['theme'];
}

interface State {
  mode: ToasterProps['theme'];
  actions: {
    setMode: (mode: ToasterProps['theme']) => void;
  };
}

const themeStore = createStoreFactory<State>('theme-store', (set) => ({
  mode: browserStorage.getItem<Storage>(themeStorageKey)?.mode ?? 'system',
  actions: {
    setMode(mode) {
      set((state) => {
        state.mode = mode;
        browserStorage.setItem(themeStorageKey, { mode: state.mode });
      });
    },
  },
}));

export const useThemeStore = themeStore as UseBoundStore<StoreApi<Omit<State, 'actions'>>>;
export const useThemeStoreActions = () => themeStore((state: State) => state.actions);
