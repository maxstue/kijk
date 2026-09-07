# Local API load tests

The k6 scenarios are manual developer checks. They are deliberately not part of CI/CD and refuse to run against
non-loopback hosts. This avoids accidental load against production when no dedicated staging environment exists.

## Prerequisites

- PostgreSQL and the current database schema are available locally.
- The API configuration is available through the `/Api` Infisical path.
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) is installed.
- The API has been built in Release configuration.

## Start the Release build locally

From the repository root, build the API once:

```bash
pnpm --filter kijk-api build
```

Then start that exact Release output in a dedicated terminal:

```bash
pnpm --filter kijk-api start:release
```

The `dev` launch profile exposes the local HTTP endpoint at `http://localhost:5140`. `K6_BASE_URL` defaults to this
address and can only be changed to another loopback address.

## Run the scenarios manually

Run the unauthenticated health scenario:

```bash
pnpm --filter kijk-api load:health
```

Run the authenticated resources scenario:

```bash
LOAD_TEST_AUTH_TOKEN='<long-lived Clerk JWT>' pnpm --filter kijk-api load:resources
```

Optional environment variables:

- `LOAD_TEST_BASE_URL`: local API URL, default `http://localhost:5140`
- `LOAD_TEST_VUS`: concurrent virtual users, default `10`
- `LOAD_TEST_DURATION`: test duration, default `30s`
- `LOAD_TEST_P95_MS`: maximum accepted p95 response time in milliseconds, default `500`

## Clerk token for the authenticated scenario

Use a separate, non-privileged load-test user. Follow Clerk's
[Postman or Insomnia testing guide](https://clerk.com/docs/guides/development/testing/postman-or-insomnia) to create a
blank JWT template with a longer token lifetime. Sign in to the local Kijk client with the same Clerk instance and
generate the token in the browser console:

```js
await window.Clerk.session.getToken({ template: 'k6-load-test' });
```

The generated JWT must contain an `azp` value permitted by the API's `Auth:AuthorizedParties` configuration, and its
`sub` user must already exist in the local Kijk database. Treat the token like a password: never commit it, paste it
into documentation, or store it in a tracked environment file. Rotate it when it is no longer needed.
