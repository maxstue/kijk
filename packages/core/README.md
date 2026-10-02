# @kijk/core

Framework-level utilities shared by the Kijk apps and `@kijk/ui`: store helpers, browser storage, hooks and a logger.
It contains no feature or API code.

## Contents

| Import path                      | Export               | Purpose                                                                               |
| -------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `@kijk/core/utils/store`         | `createStoreFactory` | Creates a zustand store with immer and devtools (devtools only in dev).               |
| `@kijk/core/stores/theme-store`  | `useThemeStore`      | Theme mode (light, dark, system), persisted in local storage.                         |
| `@kijk/core/lib/browser-storage` | `browserStorage`     | JSON `getItem`/`setItem` for local or session storage, optionally validated with Zod. |
| `@kijk/core/lib/logger`          | `logger`             | Console logger with timestamp and colored level.                                      |
| `@kijk/core/lib/constants`       | `themeStorageKey`    | Storage key of the theme settings.                                                    |
| `@kijk/core/hooks/use-mobile`    | `useIsMobile`        | Whether the viewport is narrower than 768 px.                                         |

## Usage

```ts
import { createStoreFactory } from '@kijk/core/utils/store';

interface CounterState {
  count: number;
  actions: { increment: () => void };
}

export const useCounterStore = createStoreFactory<CounterState>('counter-store', (set) => ({
  count: 0,
  actions: {
    increment() {
      set((state) => {
        state.count += 1;
      });
    },
  },
}));
```

```ts
import { browserStorage } from '@kijk/core/lib/browser-storage';

browserStorage.setItem('settings', { compact: true });
const settings = browserStorage.getItem<{ compact: boolean }>('settings');
```

## Scripts

`pnpm typecheck`, `pnpm lint`, `pnpm fmt` (and `lint:fix` / `fmt:fix`).
