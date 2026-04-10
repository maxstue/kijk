import {
  reactHooksRules,
  tanstackQueryRules,
  reactHooksJsPlugin,
  tanstackQueryJsPlugin,
  tanstackRouterRules,
  tanstackRouterJsPlugin,
  sharedIgnorePatterns,
} from '@kijk/config/oxlint';
import baseConfig from '@kijk/config/oxlint-base';
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
  jsPlugins: [reactHooksJsPlugin, tanstackRouterJsPlugin, tanstackQueryJsPlugin],
  rules: {
    ...reactHooksRules,
    ...tanstackRouterRules,
    ...tanstackQueryRules,
    'react-hooks-js/incompatible-library': 'warn',
  },
});
