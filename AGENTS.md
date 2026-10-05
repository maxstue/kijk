# Kijk Agent Instructions

## Project Structure

**pnpm monorepo** with app and package workspaces:
- `apps/` — api (dotnet), client (React/Vite)
- `packages/` — `@kijk/ui` (shared components), `@kijk/core` (utilities, stores, hooks), `@kijk/config` (shared tsconfig/lint/format configs)

## Developer Commands

### Root (pnpm)
```bash
pnpm dev          # client + api (parallel)
pnpm dev:client   # client only
pnpm dev:api      # api only
pnpm build        # all apps (parallel)
pnpm lint         # lint all workspaces
pnpm fmt          # check formatting in all workspaces
pnpm release      # auto-changelog + GitHub release (CalVer: yyyy.mm.minor)
```

### Client (`apps/client`)
```bash
pnpm dev          # Vite+ dev server via Infisical
pnpm build        # tsc && vp build
pnpm lint         # oxlint
pnpm fmt          # oxfmt --check
pnpm fmt:fix     # oxfmt
pnpm typecheck    # tsc --noEmit
```

### API (`apps/api`)
```bash
dotnet watch run --project src/Api/Api.csproj --launch-profile https
dotnet build src/Api/Api.csproj -c Release
dotnet format --verify-no-changes --exclude '**/Migrations/'
dotnet ef database update
```

## Package Structure

- **`@kijk/ui`** — UI components (buttons, dialogs, etc.) using base-ui/radix-ui
- **`@kijk/core`** — Utilities: `cn()`, zustand stores, hooks (use-mobile), browser-storage, logger
- **`@kijk/config`** — Shared lint/format config exports (oxlint/oxfmt)

## Environment Setup

### Client
```bash
cp apps/client/.env apps/client/.env.local
# Required: VITE_CLERK_PUBLISHABLE_KEY (create free Clerk org)
# Optional: VITE_SENTRY_DSN (can leave empty for local dev)
```

### API
```bash
dotnet tool restore
docker compose up                          # starts PostgreSQL
dotnet ef database update                   # creates/updates DB schema
# Manage secrets via: dotnet user-secrets set <key> <value>
```

### API Auth Configuration (user-secrets)
```json
"Auth": {
  "Authority": "<your Clerk URL>",
  "AuthorizedParties": ["http://localhost:5004"]
}
```

## Architecture Notes

- **Client**: TanStack Router auto-generates `src/routeTree.gen.ts` — do not edit manually
- **Client feature boundaries**: `routes/*` defines route context and page structure (search validation, loaders, pending/error states, layout shell, and feature composition); `app/<feature>/*` owns feature components, forms, sections, hooks, schemas, and feature logic; `app/<feature>/*` must not import another feature folder directly; `shared/*` must not import from `app/*`; enforced by `@kijk/oxlint-plugin-boundaries`
- **Client feature file naming**: feature folders act as namespaces. Inside `app/<feature>`, omit the feature name from file names when the folder already provides that context. Prefer reserved feature-local names like `constants.ts`, `types.ts`, `schemas.ts`, `helpers.ts`, `utils.ts`, `columns.tsx`, and `options.ts`. Component files stay kebab-case, while exported React components stay PascalCase and should remain understandable outside their file.
- **Client data access**: reusable API calls, query keys, `queryOptions`, and `mutationOptions` live in `apps/client/src/shared/api`; keep feature form schemas inside their feature folders
- **Client query keys**: use `apps/client/src/shared/api/query-keys.ts` for cache reads, writes, and invalidations instead of ad hoc key arrays
- **API**: Clean Architecture layers: Api → Application → Domain/Infrastructure/Shared
- **API authorization**: Clerk only authenticates. Roles and permissions are household-scoped, stored in the database, and defined as code catalogs in `Domain/Authorization` (`HouseholdPermissions`, `HouseholdRoles`, seeded via EF `HasData`). Check permissions, never role names. Every authenticated endpoint must declare one of `.RequireHouseholdPermission(...)` (active household), `.RequireRouteHouseholdPermission(...)` (handler checks the route household via `AuthorizeHouseholdAsync`), or `.WithoutHouseholdPermission(reason)`; `EndpointAuthorizationTests` enforces this. The client mirrors the catalog in `apps/client/src/shared/api/households/permissions.ts`.
- **Private finances**: households are called "spaces" in the UI. Every user has a personal space (`Household.IsPersonal`) that is never deleted and never shared. In shared spaces, accounts and budgets can be private (`OwnerId`); transactions and imports inherit the visibility of their account. Read finance data only through `Application/Shared/Finances/FinanceQueryExtensions` (`GetHouseholdAccounts`, `GetVisibleTransactions`, `GetVisibleBudgets`, `GetVisibleImports`), and guard changes to shared items with `AuthorizeSharedChangeAsync`.
- **Database**: PostgreSQL via Docker Compose; schema managed with `dotnet ef`
- **UI package**: `@kijk/ui` exports from `src/components/*`
- **Core package**: `@kijk/core` exports from `src/utils/*`, `src/lib/*`, `src/hooks/*`, `src/stores/*`

## Important Conventions

- **Node/pnpm**: Managed via `package.json` (`engines`, `devEngines`)
- **.NET**: 10.0 (per `global.json`)
- **Vite+ config**: `apps/client/vite.config.ts` configures the client app.
- **Format config**: `oxfmt.config.ts` (printWidth: 120, singleQuote, LF line endings)
- **Client lint/format**: Uses oxlint/oxfmt (NOT eslint/prettier for code style)
- **Frontend checks**: After client/frontend edits, always run React Doctor on the changed code. If it fails, committing is still allowed, but the final response must include a clear warning with the failed command and reason.
- **Pre-commit hooks**: husky + lint-staged configured (runs on commit)

## Project Skills

- **Conventional Commits**: For all git commit tasks, follow `.agents/skills/conventional-commits/SKILL.md`.
- **React Doctor**: After frontend React changes, before committing React code, or when improving frontend code quality, follow `.agents/skills/react-doctor/SKILL.md`.
- **.NET Best Practices**: For .NET/C# code changes, follow `.agents/skills/dotnet-best-practices/SKILL.md`.
- **Railway**: For Railway infrastructure, deployments, services, environments, buckets, and build/runtime troubleshooting, follow `.agents/skills/use-railway/SKILL.md`.
- **Vite**: For Vite configuration, plugin API, SSR, build, and migration work, follow `.agents/skills/vite/SKILL.md`.

## Required Order for CI
```
build → format → lint → audit
```

## Key Dependencies
- **Auth**: Clerk (frontend + backend validation)
- **Error tracking**: Sentry
- **Style**: Tailwind v4 (client)
- **Router**: TanStack Router (file-based, generates types)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **UI Primitives**: base-ui/react + radix-ui
