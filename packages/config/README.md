# @kijk/config

Shared tooling configuration for all TypeScript workspaces: TypeScript, [oxlint](https://oxc.rs/docs/guide/usage/linter)
and [oxfmt](https://oxc.rs/docs/guide/usage/formatter). Changing a setting here changes it everywhere.

## TypeScript

```json
{
  "extends": "@kijk/config/tsconfig/base.json"
}
```

## oxfmt

```ts
// oxfmt.config.ts
import { sharedFormatConfig } from "@kijk/config/oxfmt";
import { defineConfig } from "oxfmt";

export default defineConfig({
  ...sharedFormatConfig,
});
```

## oxlint

`@kijk/config/oxlint-base` is the base config (ESLint, TypeScript and JSDoc rules plus the `oxc`, `promise`, `import`
and `vitest` plugins). `@kijk/config/oxlint` adds building blocks to combine on top of it:

- `sharedIgnorePatterns`: paths every workspace ignores
- `reactHooksJsPlugin` + `reactHooksRules`: React Hooks and React Compiler rules
- `tanstackRouterJsPlugin` + `tanstackRouterRules`, `tanstackQueryJsPlugin` + `tanstackQueryRules`: TanStack rules

```ts
// oxlint.config.ts
import { reactHooksJsPlugin, reactHooksRules, sharedIgnorePatterns } from "@kijk/config/oxlint";
import baseConfig from "@kijk/config/oxlint-base";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns],
  jsPlugins: [reactHooksJsPlugin],
  rules: {
    ...reactHooksRules,
  },
});
```

See `apps/client/oxlint.config.ts` for the complete setup, including the
[`@kijk/oxlint-plugin-boundaries`](../oxlint-plugin-boundaries/README.md) rule.

## Scripts

`pnpm typecheck`, `pnpm lint`, `pnpm fmt` (and `lint:fix` / `fmt:fix`).
