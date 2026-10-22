# Kijk Agent Instructions

## Project Structure

**pnpm monorepo** with app and package workspaces:

- `apps/` — api (dotnet), client (React/Vite)
- `packages/` — `@kijk/api` (typed API client, query keys, query/mutation options), `@kijk/ui` (shared components), `@kijk/core` (utilities, stores, hooks), `@kijk/config` (shared tsconfig/lint/format configs), `@kijk/openapi-codegen` (generates the API types)

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

- **`@kijk/api`** — Typed client for the Kijk API: generated OpenAPI types, requests, query keys, `queryOptions` and `mutationOptions`; apps call `configureApiClient()` once at startup
- **`@kijk/ui`** — UI components (buttons, dialogs, etc.) using Base UI (`@base-ui/react`)
- **`@kijk/core`** — Zustand stores, hooks (use-mobile), browser-storage, logger
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
- **Client data access**: reusable API calls, query keys, `queryOptions`, and `mutationOptions` live in `packages/api` (`@kijk/api`); keep feature form schemas inside their feature folders. Regenerate the API types with `pnpm api:generate` after API changes
- **Client query keys**: use `packages/api/src/query-keys.ts` for cache reads, writes, and invalidations instead of ad hoc key arrays
- **Client cache invalidation**: each `mutationOptions` invalidates or updates what its API change affects (via `onSuccess` and the mutation context's `client`); components only add UI reactions such as toasts, navigation or closing dialogs, preferably as `mutate(..., { onSuccess })` callbacks. A hook-level `onSuccess` replaces the one from the options, so call `options.onSuccess` from it
- **API**: Clean Architecture layers: Api → Application → Domain/Infrastructure/Shared
- **API use-case naming**: feature folders and namespaces provide the domain context. Use short local names such as `StatisticsHandler`, `RecordHandler`, `ConfirmMappingHandler` and `HandleAsync` for a single use case; name shared query methods after their operation (`ListAsync`, `DetailsAsync`, `OverviewAsync`). Keep existing query grouping where appropriate. Use `Handler.cs` inside a use-case folder. Public request/response DTO names retain enough context to be unique in OpenAPI.
- **API endpoint names**: endpoint methods use local operation names (`List`, `Details`, `Statistics`, `Record`, `ConfirmMapping`); every endpoint declares a globally unique `.WithName("Feature.Operation")`. Keep `CreatedAtRoute` and `AcceptedAtRoute` references aligned with these names.
- **API client naming**: request functions and query/mutation options in `packages/api/src/<feature>` omit the feature name (`getStatistics`, `statisticsQueryOptions`, `recordMutationOptions`). Use feature namespace imports at cross-feature call sites, e.g. `budgetsOptions.statisticsQueryOptions(...)`. Use `remove` and `exportCsv` for request functions where JavaScript reserves `delete` and `export`.
- **API registration**: every Application feature owns a `ModuleService : IModule` that explicitly registers its handlers and injectable helper services. Use `Scoped` for request/job services, especially those using `AppDbContext` or `CurrentUser`. Source generators in `Api.SourceGenerators` discover modules, endpoint groups (`IEndpointGroup`) and FluentValidation validators (one per request type).
- **API service ownership**: feature services belong to their feature module; central Application registration only composes modules, validators and shared services such as `TimeProvider`. Infrastructure owns technical adapters and their registrations. Pure static calculations do not need DI.
- **API documentation**: document public API request/response contracts and important domain rules; XML output stays enabled for OpenAPI. Do not add comments that only repeat handler, parameter, or adapter names. Missing-documentation errors are scoped to dedicated contract files in `apps/api/.editorconfig`.
- **API response mapping**: map entities to responses with Mapperly (`[Mapper]` static partial classes, one `ToResponse` for entities and one for `IQueryable` projections); `Application/MapperDefaults.cs` requires every response member to be mapped or explicitly ignored. Map by hand only when the mapping needs request context (e.g. `CurrentUser`) or filters inside a handler query
- **API authorization**: Clerk only authenticates. Roles and permissions are space-scoped, stored in the database, and defined as code catalogs in `Domain/Authorization` (`SpacePermissions`, `SpaceRoles`, seeded via EF `HasData`). Check permissions, never role names. Every authenticated endpoint must declare one of `.RequireSpacePermission(...)` (active space), `.RequireRouteSpacePermission(...)` (handler checks the route space via `AuthorizeSpaceAsync`), or `.WithoutSpacePermission(reason)`; `EndpointAuthorizationTests` enforces this. The client mirrors the catalog in `packages/api/src/spaces/permissions.ts`.
- **Private finances**: spaces group users, their roles and all data. Every user has a personal space (`Space.IsPersonal`) that is never deleted and never shared. In shared spaces, accounts and budgets can be private (`OwnerId`); transactions and imports inherit the visibility of their account. Read finance data only through `Application/Shared/Finances/FinanceQueryExtensions` (`GetSpaceAccounts`, `GetVisibleTransactions`, `GetVisibleBudgets`, `GetVisibleImports`), and guard changes to shared items with `AuthorizeSharedChangeAsync`.
- **Database**: PostgreSQL via Docker Compose; schema managed with `dotnet ef`
- **API package**: `@kijk/api` exports every module from `src/*` (e.g. `@kijk/api/transactions/options`)
- **UI package**: `@kijk/ui` exports from `src/components/*`
- **Core package**: `@kijk/core` exports from `src/lib/*`, `src/hooks/*`, `src/stores/*`

## Important Conventions

- **Node/pnpm**: Managed via `package.json` (`engines`, `devEngines`)
- **.NET**: 10.0 (per `global.json`)
- **Vite+ config**: `apps/client/vite.config.ts` configures the client app.
- **Format config**: `oxfmt.config.ts` (printWidth: 120, singleQuote, LF line endings)
- **Client lint/format**: Uses oxlint/oxfmt (NOT eslint/prettier for code style)
- **Frontend checks**: After client/frontend edits, always run React Doctor on the changed code. If it fails, committing is still allowed, but the final response must include a clear warning with the failed command and reason.
- **Client tests**: Colocate unit, component, and route tests with the source file they test. Reserve `apps/client/src/test` for E2E tests and shared test setup (including render helpers and mocks). The TanStack Router plugin ignores `.test.*` and `.spec.*` files through `routeFileIgnorePattern`.
- **Pre-commit hooks**: husky + lint-staged configured (runs on commit)

## Project Skills

- **Conventional Commits**: For all git commit tasks, follow `.agents/skills/conventional-commits/SKILL.md`.
- **React Doctor**: After frontend React changes, before committing React code, or when improving frontend code quality, follow `.agents/skills/react-doctor/SKILL.md`.
- **.NET Best Practices**: For .NET/C# code changes, follow `.agents/skills/dotnet-best-practices/SKILL.md`.
- **Railway**: For Railway infrastructure, deployments, services, environments, buckets, and build/runtime troubleshooting, follow `.agents/skills/use-railway/SKILL.md`.
- **Vite**: For Vite configuration, plugin API, SSR, build, and migration work, follow `.agents/skills/vite/SKILL.md`.

## CI (GitHub Actions)

- **Entry workflows** (`ci.yml`, `deployment.yml`) only define triggers and compose building blocks; they contain no check logic.
- **Reusable workflows** (`.github/workflows/_*.yml`) are the building blocks, one per area: `_changes` (path filter, PRs only), `_js-workspace` (one JavaScript app or package), `_dotnet` (one .NET app), `_js-e2e` (E2E tests for one app), `_js-audit`, `_sonar` (reuses the coverage artifacts of the same run). `ci.yml` calls `_js-workspace` and `_dotnet` once per app or package, so each has one job in the checks list and graph. Its steps run sequentially: format, lint, build (or typecheck), tests and, for .NET, audit. Workspace jobs run independently in parallel.
- **Composite actions** (`.github/actions/*`) hold shared steps: `setup-js` (Vite+, install, cached Playwright), `setup-dotnet`, `deploy-railway`, `migrate-database`, `create-release`.
- `ci-result` is the only required status check.
- New app or package: add an `apps-<name>` or `packages-<name>` job in `ci.yml` that calls `_js-workspace.yml` (inputs `workspace`, `directory`, optionally `build`, `test`, `browser`) or `_dotnet.yml` (inputs `workspace`, `directory`, `solution`, optionally `format-exclude`), and add it to the `needs` lists of `sonar` and `ci-result`; Sonar picks up its coverage automatically. A JavaScript workspace needs the scripts `fmt`, `lint`, `typecheck` (plus `build` / `test:coverage` if enabled). For E2E, add a separate caller of `_js-e2e.yml` (inputs `workspace`, `directory`, optionally `command`, `timeout`, `secrets-env`, `secrets-path`) that needs the app checks, grants `id-token: write` for Infisical, and is included in `ci-result.needs`. Workspace checks need only read access.
- The checks within a workspace run sequentially with one setup; E2E waits for that app's checks. Sonar waits for workspace coverage and can run alongside E2E; `ci-result` also requires E2E to pass. On pull requests, `_changes` selects the affected JavaScript workspaces (changed ones plus their dependents, via pnpm) and the other blocks are skipped; changes to shared files (root manifests, lockfile, JavaScript CI) check all of them.

## Key Dependencies

- **Auth**: Clerk (frontend + backend validation)
- **Error tracking**: Sentry
- **Style**: Tailwind v4 (client)
- **Router**: TanStack Router (file-based, generates types)
- **Forms**: React Hook Form + Zod
- **Charts**: TanStack Charts (`@tanstack/charts`, React adapter)
- **UI Primitives**: Base UI (`@base-ui/react`)
