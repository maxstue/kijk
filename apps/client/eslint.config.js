// @ts-check
import eslint from '@eslint/js';
import tanstackQueryPlugin from '@tanstack/eslint-plugin-query';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('typescript-eslint').ConfigWithExtends} */
const baseESLintConfig = {
  name: 'eslint',
  extends: [eslint.configs.recommended],
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const disableTypeChecked = {
  name: 'disableTypeChecked',
  files: ['**/*.js'],
  extends: [tseslint.configs.disableTypeChecked],
  rules: {
    // turn off other type-aware rules
    // 'deprecation/deprecation': 'off',
    '@typescript-eslint/internal/no-poorly-typed-ts-props': 'off',
    // turn off rules that don't apply to JS code
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const typescriptConfig = {
  name: 'typescript',
  extends: [...tseslint.configs.stylisticTypeChecked, ...tseslint.configs.recommendedTypeChecked],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { modules: true, jsx: true },
      jsxPragma: undefined,
      project: true,
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
      projectFolderIgnoreList: ['**/node_modules/**'],
    },
    globals: {
      ...globals.builtin,
      ...globals.browser,
      ...globals.es2025,
      ...globals.serviceworker,
    },
  },
  linterOptions: {
    reportUnusedDisableDirectives: 'error',
  },
  rules: {
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    '@typescript-eslint/array-type': ['warn', { default: 'array-simple', readonly: 'array-simple' }],
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
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const reactConfig = {
  name: 'react',
  extends: [reactPlugin.configs.flat.recommended],
  plugins: {
    'react-hooks': reactHooksPlugin,
    'react-refresh': reactRefreshPlugin,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/jsx-boolean-value': 'error',
    'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'react/jsx-no-target-blank': 'off',
    'react/jsx-max-props-per-line': 'off',
    'react/jsx-sort-props': [
      'error',
      {
        callbacksLast: true,
        shorthandFirst: true,
        reservedFirst: true,
        multiline: 'last',
      },
    ],
    'react/no-unknown-property': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/jsx-uses-react': 'off',
  },
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const unicornConfig = {
  name: 'unicorn',
  // @ts-ignore
  extends: [eslintPluginUnicorn.configs['flat/recommended']],
  rules: {
    'unicorn/no-array-reduce': 'warn',
    'unicorn/no-null': 'warn',
    'unicorn/no-useless-undefined': 'warn',
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
      },
    ],
    'unicorn/prevent-abbreviations': [
      'error',
      {
        replacements: {
          db: false,
          dev: false,
          arg: false,
          args: false,
          env: false,
          fn: false,
          func: {
            fn: true,
            function: false,
          },
          prop: false,
          props: false,
          ref: false,
          refs: false,
        },
        ignore: ['semVer', 'SemVer'],
      },
    ],
  },
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const ignoreFiles = {
  name: 'ignoreFiles',
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
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const onlyFiles = {
  name: 'onlyFiles',
  files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
};

export default tseslint.config(
  baseESLintConfig,
  typescriptConfig,
  prettierConfig,
  reactConfig,
  unicornConfig,
  // @ts-ignore
  ...tanstackQueryPlugin.configs['flat/recommended'],
  disableTypeChecked,
  ignoreFiles,
  onlyFiles,
);
