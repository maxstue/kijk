import { browserStorage } from '@kijk/core/lib/browser-storage';
import { themeStorageKey } from '@kijk/core/lib/constants';
import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface Storage {
  mode: ThemeMode;
}

interface State {
  mode: ThemeMode;
  actions: {
    setMode: (mode: ThemeMode) => void;
  };
}

/** Store with the theme mode (light, dark or system), persisted in browser storage. */
export const useThemeStore = create<State>((set) => ({
  mode: browserStorage.getItem<Storage>(themeStorageKey)?.mode ?? 'system',
  actions: {
    setMode(mode) {
      browserStorage.setItem(themeStorageKey, { mode });
      set({ mode });
    },
  },
}));

/** Returns the actions of the theme store. */
export const useThemeStoreActions = () => useThemeStore((state) => state.actions);
