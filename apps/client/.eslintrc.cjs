/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:react-perf/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:@tanstack/eslint-plugin-query/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'tailwind.config.ts', 'postcss.config.js', 'src/routeTree.gen.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react-refresh'],
  rules: {
    // typescript
    '@typescript-eslint/array-type': ['warn', { default: 'array-simple', readonly: 'array-simple' }],
    '@typescript-eslint/no-misused-promises': 'off',
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
    // react
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/prop-types': ['error', { ignore: ['className', 'classNames', 'showOutsideDays'] }],
    'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }],
    // react-perf
    'react-perf/jsx-no-new-function-as-prop': 'warn',
    'react-perf/jsx-no-new-object-as-prop': 'off',
    'react-perf/jsx-no-new-array-as-prop': 'warn',
  },
};
