import { useEffect } from 'react';

import { useThemeStore } from '@/shared/stores/theme-store';

const THEME_REGEX = /^theme.*/;

export function ThemeSwitcher() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (THEME_REGEX.test(className)) {
        document.body.classList.remove(className);
      }
    });

    if (theme) {
      return document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return null;
}
