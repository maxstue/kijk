import { useEffect } from 'react';

import { useThemeStore } from '@/stores/theme-store';

export function ThemeSwitcher() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^theme.*/)) {
        document.body.classList.remove(className);
      }
    });

    if (theme) {
      return document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return null;
}
