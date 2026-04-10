import baseConfig from '@kijk/config/oxlint-base';
import { reactHooksJsPlugin, reactHooksRules, sharedIgnorePatterns } from '@kijk/config/oxlint';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns],
  categories: {
    correctness: 'warn',
    style: 'warn',
    perf: 'warn',
  },
  env: {
    builtin: true,
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['react', 'react-perf'],
  jsPlugins: [reactHooksJsPlugin],
  rules: {
    ...reactHooksRules,
  },
});
