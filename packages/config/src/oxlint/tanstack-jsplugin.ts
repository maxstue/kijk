/** Oxlint JS plugin entry for the TanStack Router ESLint plugin. */
export const tanstackRouterJsPlugin = {
  name: 'eslint-tanstack-router',
  specifier: '@tanstack/eslint-plugin-router',
} as const;

/** Oxlint JS plugin entry for the TanStack Query ESLint plugin. */
export const tanstackQueryJsPlugin = {
  name: 'eslint-tanstack-query',
  specifier: '@tanstack/eslint-plugin-query',
} as const;

/** TanStack Router rules with their severities. */
export const tanstackRouterRules = {
  'eslint-tanstack-router/create-route-property-order': 'error',
} as const;

/** TanStack Query rules with their severities. */
export const tanstackQueryRules = {
  'eslint-tanstack-query/exhaustive-deps': 'warn',
  'eslint-tanstack-query/stable-query-client': 'warn',
  'eslint-tanstack-query/no-rest-destructuring': 'warn',
  'eslint-tanstack-query/no-unstable-deps': 'warn',
  'eslint-tanstack-query/infinite-query-property-order': 'warn',
  'eslint-tanstack-query/no-void-query-fn': 'warn',
  'eslint-tanstack-query/mutation-property-order': 'warn',
} as const;
