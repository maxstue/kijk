import { useEffect } from 'react';

import { useThemeStore } from '@/shared/stores/theme-store';

const THEME_REGEX = /^theme.*/;

export function ThemeSwitcher() {
  const { theme } = useThemeStore();

  useEffect(() => {
    for (const className of document.body.classList) {
      if (THEME_REGEX.test(className)) {
        document.body.classList.remove(className);
      }
    }

    document.body.classList.add(`theme-${theme}`);
    return;
  }, [theme]);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
