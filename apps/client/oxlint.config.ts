import {
  reactHooksJsPlugin,
  reactHooksRules,
  sharedIgnorePatterns,
  tanstackQueryJsPlugin,
  tanstackQueryRules,
  tanstackRouterJsPlugin,
  tanstackRouterRules,
} from '@kijk/config/oxlint';
import baseConfig from '@kijk/config/oxlint-base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'warn',
    perf: 'warn',
    style: 'warn',
  },
  env: {
    builtin: true,
  },
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns],
  jsPlugins: [reactHooksJsPlugin, tanstackRouterJsPlugin, tanstackQueryJsPlugin],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['react', 'react-perf'],
  rules: {
    ...reactHooksRules,
    ...tanstackRouterRules,
    ...tanstackQueryRules,
    'react-hooks-js/incompatible-library': 'warn',
  },
});
