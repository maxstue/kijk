export const tanstackRouterJsPlugin = {
  name: "eslint-tanstack-router",
  specifier: "@tanstack/eslint-plugin-router",
} as const;

export const tanstackQueryJsPlugin = {
  name: "eslint-tanstack-query",
  specifier: "@tanstack/eslint-plugin-query",
} as const;

export const tanstackRouterRules = {
  "eslint-tanstack-router/create-route-property-order": "warn",
} as const;

export const tanstackQueryRules = {
  "eslint-tanstack-query/exhaustive-deps": "warn",
  "eslint-tanstack-query/stable-query-client": "warn",
  "eslint-tanstack-query/no-rest-destructuring": "warn",
  "eslint-tanstack-query/no-unstable-deps": "warn",
  "eslint-tanstack-query/infinite-query-property-order": "warn",
  "eslint-tanstack-query/no-void-query-fn": "warn",
  "eslint-tanstack-query/mutation-property-order": "warn",
} as const;
