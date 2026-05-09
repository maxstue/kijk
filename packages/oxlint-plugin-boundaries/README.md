# @kijk/oxlint-plugin-boundaries

Internal Oxlint JS plugin for enforcing feature folder boundaries.

## Purpose

The plugin prevents feature folders from importing each other directly. Shared code must live in shared layers, while
route/layout files can compose multiple features.

It currently checks alias imports such as `@/app/resources/schemas`.

## Rule

### `no-cross-feature-imports`

Reports:

- `shared/*` importing from `app/*`
- `app/<feature>/*` importing from `app/<other-feature>/*`

Allows:

- `routes/*` importing from `app/*`
- `app/<feature>/*` importing from the same feature
- feature files importing from `shared/*`, `@kijk/ui`, or `@kijk/core`

## Usage

```ts
import {
  reactHooksJsPlugin,
  tanstackQueryJsPlugin,
  tanstackRouterJsPlugin,
} from "@kijk/config/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    reactHooksJsPlugin,
    tanstackRouterJsPlugin,
    tanstackQueryJsPlugin,
    {
      name: "kijk-boundaries",
      specifier: "@kijk/oxlint-plugin-boundaries",
    },
  ],
  rules: {
    "kijk-boundaries/no-cross-feature-imports": [
      "error",
      {
        alias: "@",
        compositionDirs: ["routes"],
        featuresDir: "app",
        root: "src",
        sharedDirs: ["shared"],
      },
    ],
  },
});
```

## Options

- `alias`: import alias prefix, for example `@`.
- `root`: source root used to calculate file locations, for example `src`.
- `featuresDir`: directory containing feature folders, for example `app`.
- `sharedDirs`: directories that must not import features, for example `['shared']`.
- `compositionDirs`: directories that may compose features, for example `['routes']`.

## Example

Disallowed:

```ts
// src/app/consumptions/example.ts
import { resourceSchema } from "@/app/resources/schemas";
```

Allowed:

```ts
// src/routes/_protected/consumptions.tsx
import { ConsumptionCreateForm } from "@/app/consumptions/consumption-create-form";
```
