import { sharedIgnorePatterns } from '@kijk/config/oxlint';
import baseConfig from '@kijk/config/oxlint-base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  overrides: [{ files: ['**/*.test.{ts,tsx}'], rules: { 'typescript/no-floating-promises': 'error' } }],
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns],
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
