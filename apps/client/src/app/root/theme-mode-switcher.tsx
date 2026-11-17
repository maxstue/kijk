import { useThemeStore } from '@kijk/core/stores/theme-store';
import { useEffect } from 'react';

/** Applies the stored theme mode (light, dark or system) to the document. Renders nothing. */
export function ThemeModeSwitcher() {
  const { mode } = useThemeStore();

  useEffect(() => {
    const root = globalThis.document.documentElement;

    root.classList.remove('light', 'dark');

    if (mode !== 'system') {
      root.classList.add(mode ?? 'light');
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = () => {
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    applySystemTheme();
    mediaQuery.addEventListener('change', applySystemTheme);
    return () => mediaQuery.removeEventListener('change', applySystemTheme);
  }, [mode]);

  return undefined;
}
