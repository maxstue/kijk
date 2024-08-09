// @ts-check
import eslint from '@eslint/js';
import tanstackQueryPlugin from '@tanstack/eslint-plugin-query';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  //Javascript & Typescript
  eslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: [
      '**/.vscode/**',
      '**/public/**',
      '**/config/**',
      '**/dist/**',
      '**/dev-dist/**',
      '**/vercel.json',
      '**/**.eslint.**',
      '**/tailwind.config.ts',
      '**/postcss.config.js',
      'src/routeTree.gen.ts',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
      // parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        jsxPragma: null,
        projectService: true,
        project: true,
        tsconfigRootDir: import.meta.dirname,
        projectFolderIgnoreList: ['**/node_modules/**'],
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/array-type': ['warn', { default: 'array-simple', readonly: 'array-simple' }],
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'warn', // TODO remove after stepper is official
      '@typescript-eslint/no-unsafe-return': 'warn', // TODO remove after stepper is official
      '@typescript-eslint/no-unsafe-member-access': 'warn', // TODO remove after stepper is official
      '@typescript-eslint/no-import-type-side-effects': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: true,
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // turn off other type-aware rules
      'deprecation/deprecation': 'off',
      '@typescript-eslint/internal/no-poorly-typed-ts-props': 'off',
      // turn off rules that don't apply to JS code
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  // React
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  reactPlugin.configs.flat.recommended,
  {
    plugins: {
      'react-refresh': reactRefreshPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // react
      'react/react-in-jsx-scope': 0,
      'react/jsx-uses-react': 0,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': ['warn', { ignore: ['children', 'types', 'className', 'classNames', 'showOutsideDays'] }],
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }],
    },
  },
  // Others
  {
    plugins: {
      '@tanstack/query': tanstackQueryPlugin,
    },
  },
  prettierConfig,
);
