import { useEffect } from 'react';

import { useThemeStore } from '@/shared/stores/theme-store';

export function ThemeModeSwitcher() {
  const { mode } = useThemeStore();

  useEffect(() => {
    const root = globalThis.document.documentElement;

    root.classList.remove('light', 'dark');

    if (mode === undefined) {
      root.classList.add('light');
      return;
    }

    if (mode === 'system') {
      const systemTheme = globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(mode);
  }, [mode]);

  useEffect(() => {
    const root = globalThis.document.documentElement;

    const listener = (event: MediaQueryListEvent) => {
      root.classList.remove('light', 'dark');
      root.classList.add(event.matches ? 'dark' : 'light');
    };

    globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
  }, []);

  return undefined;
}
