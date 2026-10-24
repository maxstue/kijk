# Kijk web application

`apps/client` is the single TanStack Start application for both the public website and the signed-in React app. Public pages are server-rendered. The `/_authenticated` route branch uses `ssr: false`; it keeps the existing client-side routing and URLs.

## Development and checks

Run commands from the monorepo root with the Node/pnpm versions specified in `package.json`:

```sh
pnpm dev:client
pnpm --filter kijk-client build
pnpm --filter kijk-client start
pnpm --filter kijk-client test:coverage
pnpm --filter kijk-client test:e2e
pnpm --filter kijk-client check:desktop
```

Development and local E2E commands load the existing `/Client` configuration from Infisical. Production builds produce a Nitro Node server at `apps/client/.output/server/index.mjs`. `start` runs that server and respects Railway's `PORT`; `preview` is for local inspection only.

## Web authentication and BFF

The browser sends same-origin requests to `/api/*`. Start verifies the Clerk session and forwards only explicitly allowed API operations to the fixed `API_ORIGIN`, using a token obtained on the server. The .NET API still checks feature flags, Space permissions and private finance visibility.

Required web configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`: public key included in the browser build.
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: matching server-side Clerk configuration. Secret values are runtime-only and must never use the `VITE_` prefix.
- `API_ORIGIN`: server-only API origin, for example the Railway API service's private HTTP address and port.
- `APP_ORIGIN`: canonical public HTTPS origin, used for CSRF and Clerk authorized-party checks behind the hosting proxy. Local development falls back to the request origin.

The Relay preserves JSON/ProblemDetails, multipart uploads and CSV downloads. Request bodies are limited to 16 MiB; upstream requests time out after 60 seconds and are not retried automatically. Unknown operations, cross-origin writes and anonymous data requests are rejected. Dynamic responses are not publicly cached. `/health` returns a direct HTTP 200 for readiness checks.

This is a same-origin BFF, not a claim that Clerk's browser session token is inaccessible to JavaScript. The standard Clerk browser integration still uses its documented token model. A fully server-held authentication session would need a separately verified authentication design.

## Shared React core and a later Tauri app

Feature components remain in `src/app`, reusable components in `@kijk/ui`, and API contracts/options in `@kijk/api`. Features depend on `src/shared/runtime` contracts rather than Clerk, Start server functions or a native runtime. Login UI is a web-specific exception in `src/app/auth`. Web implementations live in `src/platform/web`; server code lives in `src/server`. Lint rules enforce these boundaries.

`desktop-check` is a build fixture, not a second deployed web app. It imports the real consumption form, uses TanStack Router and injects a bounded in-memory transport into `@kijk/api`. Its build rejects Clerk and Start/server imports. The main build includes this check; output is `dist-desktop-check`.

For manual interaction testing:

```sh
pnpm --filter kijk-client check:desktop
pnpm --filter kijk-client exec vp preview --config desktop-check/vite.config.ts --port 5005
```

The fixture proves that the form can render and save without a Start server. It does not implement persistent local data, synchronization, native authentication or a packaged Tauri application. Those are follow-up work; no percentage of whole-app reuse is inferred from this one-feature check.

## Railway

Use the existing Client service with the repository root as build context, since the app imports workspace packages. Select `apps/client/railway.json` as its config file. It builds with `pnpm build:client`, starts with `pnpm --filter kijk-client start`, and checks `/health`.

Remove the former `RAILPACK_SPA_OUTPUT_DIR` setting when switching to the Node server. Keep the domain target port aligned with `PORT`. Set `API_ORIGIN` to the private API address only after verifying the service's internal domain and listening port. Keep public API domains until their remaining consumers and public callbacks have been audited; using an internal BFF upstream alone does not remove those domains.

Optional `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY` and `VITE_POSTHOG_URL` configure both browser and web-server reporting. The server exports the same sampled anonymous HTTP spans to both providers; error events retain only type and stack frames. Browser analytics and performance tracing retain their existing consent behavior. Sourcemap upload credentials remain build-only secrets.

For the migration's architecture and acceptance criteria, see [the migration plan](../../docs/tanstack-start-migration-plan.md). Hosting follows [Railway's TanStack Start guide](https://docs.railway.com/guides/tanstack-start).
