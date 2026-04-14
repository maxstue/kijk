# Kijk Agent Instructions

## Project Structure

**pnpm monorepo** with app and package workspaces:
- `apps/` — api (dotnet), client (React/Vite)
- `packages/` — `@kijk/ui` (shared components), `@kijk/core` (utilities, stores, hooks), `@kijk/config` (shared tsconfig/lint/format configs)

## Developer Commands

### Root (pnpm)
```bash
pnpm dev          # client + api (parallel)
pnpm dev:all      # all apps
pnpm dev:client   # client only
pnpm dev:api      # api only
pnpm build        # all apps (parallel)
pnpm lint:all     # lint all
pnpm fmt:all      # fmt all
pnpm release      # auto-changelog + GitHub release (CalVer: yyyy.mm.minor)
```

### Client (`apps/client`)
```bash
pnpm dev          # vite dev
pnpm build        # tsc && vite build
pnpm lint         # oxlint
pnpm fmt          # oxfmt --check
pnpm fmt:fix       # oxfmt
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
  "AuthorizedParty": "http://localhost:5004"
}
```

## Architecture Notes

- **Client**: TanStack Router auto-generates `src/routeTree.gen.ts` — do not edit manually
- **API**: Clean Architecture layers: Api → Application → Domain/Infrastructure/Shared
- **Database**: PostgreSQL via Docker Compose; schema managed with `dotnet ef`
- **UI package**: `@kijk/ui` exports from `src/components/*`
- **Core package**: `@kijk/core` exports from `src/utils/*`, `src/lib/*`, `src/hooks/*`, `src/stores/*`

## Important Conventions

- **Node**: v24.14.0 (per `.nvmrc`)
- **.NET**: 10.0 (per `global.json`)
- **Codacy integration**: After edits, run Codacy CLI analyze on modified files
- **Format config**: `oxfmt.config.ts` (printWidth: 120, singleQuote, LF line endings)
- **Client lint/format**: Uses oxlint/oxfmt (NOT eslint/prettier for code style)
- **Pre-commit hooks**: husky + lint-staged configured (runs on commit)

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
