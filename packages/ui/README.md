# @kijk/ui

Shared UI components for the Kijk apps. The components are based on [shadcn/ui](https://ui.shadcn.com) (Base UI
primitives, Tailwind CSS v4) and live as source in this package, so they can be adjusted freely.

## Usage

Import the global styles once in the app entry point. They contain Tailwind, the theme tokens (light and dark) and the
Inter font:

```ts
import '@kijk/ui/globals.css';
```

Import components by file name:

```tsx
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Household</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant='outline'>Edit</Button>
      </CardContent>
    </Card>
  );
}
```

Merge class names with `cn` from the `cn` package, as the components do.

Some components need a provider higher up in the tree, e.g. `TooltipProvider` for tooltips and `SidebarProvider` for
the sidebar.

## Composition conventions

Use separately exported parts such as `Card`, `CardHeader` and `CardContent`, with named props interfaces. App-facing compound components use the same flat naming style, including `PageToolbarControls` and `PageToolbarActions`.

Apps may use these components directly and repeatedly. A wrapper should capture meaningful behavior, a domain responsibility or shared layout rules; repeated JSX alone is not a reason to add one. Structural compound components need no Context. Add Context only when their parts coordinate shared state or behavior.

See the [client composition guide](https://linear.app/justmax/document/architecture-62a60c95919b#react-component-composition) for examples, state ownership and refactoring checks.

## Adding components

`components.json` is configured for the shadcn CLI. Run it from this package to add a component; it is written to
`src/components`:

```bash
pnpm dlx shadcn@latest add <component>
```

Keep components generic. Feature-specific UI belongs in the app (`apps/client/src/app/<feature>`).

## Scripts

`pnpm typecheck`, `pnpm lint`, `pnpm fmt` (and `lint:fix` / `fmt:fix`).
