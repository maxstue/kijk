# @kijk/core

Framework-level utilities shared by the Kijk apps and `@kijk/ui`: theme state, browser storage, hooks and a logger.
It contains no feature or API code.

## Contents

| Import path                      | Export            | Purpose                                                                               |
| -------------------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `@kijk/core/stores/theme-store`  | `useThemeStore`   | Theme mode (light, dark, system), persisted in local storage.                         |
| `@kijk/core/lib/browser-storage` | `browserStorage`  | JSON `getItem`/`setItem` for local or session storage, optionally validated with Zod. |
| `@kijk/core/lib/logger`          | `logger`          | Console logger with a colored level; the console shows the caller's line.             |
| `@kijk/core/lib/constants`       | `themeStorageKey` | Storage key of the theme settings.                                                    |
| `@kijk/core/hooks/use-mobile`    | `useIsMobile`     | Whether the viewport is narrower than 768 px.                                         |

## Usage

```ts
import { browserStorage } from '@kijk/core/lib/browser-storage';

browserStorage.setItem('settings', { compact: true });
const settings = browserStorage.getItem<{ compact: boolean }>('settings');
```

## Scripts

`pnpm typecheck`, `pnpm lint`, `pnpm fmt` (and `lint:fix` / `fmt:fix`).
