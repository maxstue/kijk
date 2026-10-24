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
  ignorePatterns: [...sharedIgnorePatterns],
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
  overrides: [
    {
      files: ['src/app/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@tanstack/react-start', '@tanstack/react-start/*', '@clerk/*', '@/server/*', '@/platform/*'],
                message:
                  'Shared features use runtime contracts; web and server integrations belong to the entry point.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/app/auth/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@tanstack/react-start', '@tanstack/react-start/*', '@/server/*'],
                message: 'Login UI must not import server code.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
      rules: { 'typescript/no-floating-promises': 'error' },
    },
  ],
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
