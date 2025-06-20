// @ts-check
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';

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
const nextConfig = {
  name: 'next',
  extends: [reactPlugin.configs.flat.recommended],
    settings: {
        next: {
            rootDir: true,
        },
    },
  rules: {
        "@next/next/no-html-link-for-pages": "off",
        "no-unused-vars": "off",
        "require-await": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-shadow": ["warn"],

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],

        "@typescript-eslint/require-await": "warn",

        "@typescript-eslint/no-misused-promises": ["error", {
            checksVoidReturn: {
                arguments: false,
                attributes: false,
            },
        }],

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
const onlyFiles = {
  name: 'onlyFiles',
  files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const ignoreFiles = {
  name: 'ignoreFiles',
  ignores: [
    '**/.vscode/**',
    '**/config/**',
    '**/dist/**',
    '**/dev-dist/**',
    '**/vercel.json',
    '**/**.eslint.**',
    '**/tailwind.config.ts',
    '**/postcss.config.js',
    'src/routeTree.gen.ts',
    'dist/*',
    '**/.cache/**',
    '**/public/**',
    '**/node_modules/**',
    '**/*.esm.js'
  ],
};

export default tseslint.config(
  baseESLintConfig,
  typescriptConfig,
  prettierConfig,
  nextConfig,
  disableTypeChecked,
  ignoreFiles,
  onlyFiles,
);
