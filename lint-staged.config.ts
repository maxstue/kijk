import { defineConfig } from 'lint-staged/config';

export default defineConfig({
  'apps/client/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'pnpm --filter kijk-client exec oxlint --fix',
    'pnpm --filter kijk-client exec oxfmt',
  ],
  'apps/client/**/*.{json,css,md,yml,yaml}': 'pnpm --filter kijk-client exec oxfmt',
  'packages/api/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'pnpm --filter @kijk/api exec oxlint --fix',
    'pnpm --filter @kijk/api exec oxfmt',
  ],
  'packages/api/**/*.{json,css,md,yml,yaml}': 'pnpm --filter @kijk/api exec oxfmt',
  'packages/config/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'pnpm --filter @kijk/config exec oxlint --fix',
    'pnpm --filter @kijk/config exec oxfmt',
  ],
  'packages/config/**/*.{json,css,md,yml,yaml}': 'pnpm --filter @kijk/config exec oxfmt',
  'packages/core/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'pnpm --filter @kijk/core exec oxlint --fix',
    'pnpm --filter @kijk/core exec oxfmt',
  ],
  'packages/core/**/*.{json,css,md,yml,yaml}': 'pnpm --filter @kijk/core exec oxfmt',
  'packages/ui/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'pnpm --filter @kijk/ui exec oxlint --fix',
    'pnpm --filter @kijk/ui exec oxfmt',
  ],
  'packages/ui/**/*.{json,css,md,yml,yaml}': 'pnpm --filter @kijk/ui exec oxfmt',
  'apps/api/**/*.cs': 'pnpm run fmt:api:staged',
});
