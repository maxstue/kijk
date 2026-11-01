# @kijk/openapi-codegen

Generates the TypeScript types of the Kijk API for `@kijk/api` with
[openapi-typescript](https://openapi-ts.dev). `@kijk/api` uses them with `openapi-fetch` for fully typed requests.

The package exists only to pin **TypeScript 5** for the generator: openapi-typescript needs the JavaScript compiler API,
which TypeScript 7 (used by the rest of the repo) no longer provides.

## Usage

The API writes its OpenAPI document to `apps/api/src/Api/kijk_openapi.json` on every build. After an API change, build
the API and regenerate the types:

```bash
pnpm api:generate
```

This builds the API and runs this package's `generate` script, which writes `packages/api/src/generated/kijk.ts` and
`packages/api/src/generated/operations.ts`, and formats both files afterwards. `operations.ts` lists every HTTP operation
of the document; the web BFF relays only these. Commit the generated files and never edit them by hand.

When openapi-typescript supports TypeScript 7, this package can be removed and the generator can run in `@kijk/api`
directly.
