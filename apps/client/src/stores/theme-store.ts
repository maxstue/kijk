import { StoreApi, UseBoundStore } from 'zustand';

import { themeStorageKey } from '@/lib/constants';
import { Theme } from '@/lib/themes';
import { browserStorage, createStoreFactory } from '@/lib/utils';

interface Storage {
  mode: Mode;
  theme: Theme['name'];
  radius: number;
}

type Mode = 'dark' | 'light' | 'system';

interface State {
  mode: Mode;
  theme: Theme['name'];
  radius: number;
  actions: {
    setTheme: (theme: Theme['name'], radius?: number) => void;
    setMode: (mode: Mode) => void;
  };
}

const themeStore = createStoreFactory<State>('theme-store', (set) => ({
  mode: browserStorage.getItem<Storage>(themeStorageKey)?.mode ?? 'system',
  theme: browserStorage.getItem<Storage>(themeStorageKey)?.theme ?? 'zinc',
  radius: browserStorage.getItem<Storage>(themeStorageKey)?.radius ?? 0.5,
  actions: {
    setTheme(theme, radius) {
      set((state) => {
        state.theme = theme;

        if (radius != null) {
          state.radius = radius;
        }
        browserStorage.setItem(themeStorageKey, { mode: state.mode, theme: state.theme, radius: state.radius });
      });
    },
    setMode(mode) {
      set((state) => {
        state.mode = mode;
        browserStorage.setItem(themeStorageKey, { mode: state.mode, theme: state.theme, radius: state.radius });
      });
    },
  },
}));

export const useThemeStore = themeStore as UseBoundStore<StoreApi<Omit<State, 'actions'>>>;
export const useThemeStoreActions = () => themeStore((state) => state.actions);
