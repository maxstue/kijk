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
```

Development and local E2E commands load the existing `/Client` configuration from Infisical. Production builds produce a Nitro Node server at `apps/client/.output/server/index.mjs`. `start` runs that server and respects Railway's `PORT`; `preview` is for local inspection only.

## Web authentication and BFF

The browser sends same-origin requests to `/api/*`. Start verifies the Clerk session and forwards only the operations declared in the API's OpenAPI document to the fixed `API_ORIGIN`, using a token obtained on the server. Route guards resolve the session through the `getSession` server function. The .NET API still checks feature flags, Space permissions, private finance visibility and per-user rate limits.

Required web configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`: public key included in the browser build.
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: matching server-side Clerk configuration. Secret values are runtime-only and must never use the `VITE_` prefix.
- `API_ORIGIN`: server-only API origin: the Railway API service's private HTTP address and port. The API has no CORS policy; browsers never call it directly.
- `APP_ORIGIN`: canonical public HTTPS origin, used for CSRF and Clerk authorized-party checks behind the hosting proxy. Local development falls back to the request origin.

The Relay preserves JSON/ProblemDetails, multipart uploads and CSV downloads. Request bodies are streamed and limited to 16 MiB; upstream requests time out after 60 seconds and are not retried automatically. Only `Accept` and `Content-Type` are forwarded upstream and only `Content-Type`, `Content-Disposition` and `Retry-After` come back. Unknown operations, anonymous data requests and requests that fail the CSRF checks are rejected: `start.ts` accepts only same-origin requests for server functions and `/api/*`, and the relay additionally requires the `X-CSRF: 1` header that the browser API client sends. Dynamic responses are not publicly cached. `/health` returns a direct HTTP 200 for readiness checks.

This is a same-origin BFF, not a claim that Clerk's browser session token is inaccessible to JavaScript. The standard Clerk browser integration still uses its documented token model. A fully server-held authentication session would need a separately verified authentication design.

## Code organization

Feature components remain in `src/app`, reusable components in `@kijk/ui`, and API contracts/options in `@kijk/api`. Features use the auth contracts in `src/shared/runtime`. The root-only Clerk provider and theme bootstrap live in `src/app/root`; reusable integrations live in `src/shared/lib`. The browser-only router setup initializes telemetry services directly. Server code lives in `src/server`. E2E tests and their fake API live in `src/test/e2e`; unit and component tests remain colocated with their source files.

## E2E tests

Playwright builds the app and starts its production Node server on `http://127.0.0.1:5004`, plus a fake .NET API on port 5005. Every browser API request passes through the real Start CSRF, Clerk and relay logic. MSW handlers run only in the fake API process; E2E tests do not install a browser service worker. The fake API checks for a bearer header but does not validate JWTs or domain permissions, so these tests do not replace integration tests against the real .NET API.

The setup uses `@clerk/testing` to sign in `E2E_CLERK_USER_EMAIL` once and save browser state under `playwright/.clerk`. It needs the matching Clerk test-instance keys listed above. Both local and CI runs must provide these values when building and starting the server. Tests run with one worker and reset fake API data before each test. Unexpected console errors and page errors fail tests; expected errors can be declared through the `whitelistErrors` fixture.

`server-boundary.spec.ts` covers authenticated reads, multipart uploads, the 16 MiB limit, CSV downloads, operation filtering, CSRF and anonymous requests. The fake API records upstream request metadata for assertions and strips bearer token values. Public HTML and cross-site rejection can also be checked without Clerk configuration:

```sh
cd apps/client
pnpm exec playwright test --project chromium --no-deps --grep 'public pages deliver|rejects cross-site'
```

## Railway

Production deployments run exclusively through the existing GitHub Actions deployment workflow. Build and test locally; do not deploy with `railway up` or manual redeploy commands.

Configure the existing Client service through the Railway UI. Keep the repository root (`/`) as build context, since the app imports workspace packages. Clear the Railway Config File setting. Railway's JSON/TOML Config as Code is deprecated; this app does not use a Railway config file.

- Builder: Railpack.
- Build command: `pnpm build:client`.
- Start command: `pnpm --filter kijk-client start`.
- Healthcheck: `/health`, timeout 120 seconds.
- Watch paths: `apps/client/**`, `packages/**`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`.
- Existing domain target port: 80; runtime `PORT=80`.
- `RAILPACK_NODE_VERSION=26.12.1`.

Remove the former `RAILPACK_SPA_OUTPUT_DIR` setting when switching to the Node server. Keep the domain target port aligned with `PORT`. Set `API_ORIGIN` to the private API address only after verifying the service's internal domain and listening port. Once the deployed client relays through `API_ORIGIN`, remove the API service's public domain in the Railway UI: the API exposes no anonymous endpoints or callbacks, and without CORS browsers can no longer use it directly.

Optional `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY` and `VITE_POSTHOG_URL` configure both browser and web-server reporting. The server exports the same sampled anonymous HTTP spans to both providers; error events retain only type and stack frames. Browser analytics and performance tracing retain their existing consent behavior. Sourcemap upload credentials remain build-only secrets. When `POSTHOG_ENABLE=true`, `POSTHOG_API_KEY` must be a PostHog personal API key (`phx_`), separate from the public ingestion key in `VITE_POSTHOG_KEY`.

The migration plan is attached to [KIJK-275](https://linear.app/justmax/issue/KIJK-275/refactor-to-use-tanstck-start). Hosting follows [Railway's TanStack Start guide](https://docs.railway.com/guides/tanstack-start); see also [Config as Code deprecation](https://docs.railway.com/config-as-code).
