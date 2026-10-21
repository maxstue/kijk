# @kijk/api

Typed client for the Kijk API, shared by the Kijk apps: the generated OpenAPI types, one request function per endpoint,
the query keys and the TanStack Query `queryOptions` and `mutationOptions`. It contains no UI code.

## Setup

Configure the client once at startup, before the first request:

```ts
import { configureApiClient } from '@kijk/api/client';

configureApiClient({ baseUrl: import.meta.env.VITE_BASE_API_URL, getAuthToken: () => clerk.session?.getToken() });
```

## Structure

| Import path                    | Purpose                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `@kijk/api/<feature>/requests` | One function per endpoint, built on the generated types.                     |
| `@kijk/api/<feature>/options`  | `queryOptions` and `mutationOptions`; mutations invalidate what they change. |
| `@kijk/api/<feature>/types`    | Aliases of the generated schemas plus mutation variables.                    |
| `@kijk/api/query-keys`         | All query keys; use them for every cache read, write and invalidation.       |
| `@kijk/api/client`             | `configureApiClient` and the configured openapi-fetch client.                |
| `@kijk/api/errors`             | `ApiError`, problem details and the correlation id header.                   |
| `@kijk/api/generated/kijk`     | Types generated from the OpenAPI document; never edit by hand.               |

## Usage

```ts
const { data } = useQuery(transactionsQueryOptions({ page: 1 }));
const createTransaction = useMutation(createTransactionMutationOptions());

createTransaction.mutate(values, { onSuccess: () => toast.success('Saved') });
```

Mutations refresh the affected queries themselves. Add UI reactions as `mutate` callbacks; a hook-level `onSuccess`
replaces the one from the options, so call `options.onSuccess` from it when you need one.

## Regenerating the types

After an API change, run `pnpm api:generate` from the repository root. It builds the API, regenerates
`src/generated/kijk.ts` with `@kijk/openapi-codegen` and formats it.
