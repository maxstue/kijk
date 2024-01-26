import { useEffect } from 'react';

import { useThemeStore } from '@/shared/stores/theme-store';

export function ThemeModeSwitcher() {
  const { mode } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(mode);
  }, [mode]);

  return null;
}
