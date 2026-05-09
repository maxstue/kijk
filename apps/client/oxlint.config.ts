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
  },
  env: {
    builtin: true,
  },
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns, 'src/shared/api/generated/**'],
  jsPlugins: [
    reactHooksJsPlugin,
    tanstackRouterJsPlugin,
    tanstackQueryJsPlugin,
    {
      name: 'kijk-boundaries',
      specifier: '@kijk/oxlint-plugin-boundaries',
    },
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['react', 'react-perf'],
  rules: {
    ...reactHooksRules,
    ...tanstackRouterRules,
    ...tanstackQueryRules,
    'kijk-boundaries/no-cross-feature-imports': [
      'error',
      {
        alias: '@',
        compositionDirs: ['routes'],
        featuresDir: 'app',
        root: 'src',
        sharedDirs: ['shared'],
      },
    ],
    'react-hooks-js/incompatible-library': 'warn',
  },
});
