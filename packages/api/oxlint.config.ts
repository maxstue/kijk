import { sharedIgnorePatterns, tanstackQueryJsPlugin, tanstackQueryRules } from '@kijk/config/oxlint';
import baseConfig from '@kijk/config/oxlint-base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  overrides: [{ files: ['**/*.test.{ts,tsx}'], rules: { 'typescript/no-floating-promises': 'error' } }],
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
  },
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns, 'src/generated/**'],
  jsPlugins: [tanstackQueryJsPlugin],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    ...tanstackQueryRules,
  },
});
