import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
  },
  ignorePatterns: [
    '**/build/**',
    '**/coverage/**',
    '**/dist/**',
    '**/snap/**',
    '**/.vscode/**',
    '**/public/**',
    '**/config/**',
    '**/dev-dist/**',
    'src/routeTree.gen.ts',
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['eslint', 'typescript', 'react', 'react-perf', 'import', 'vitest', 'jsdoc', 'oxc', 'promise'],
  jsPlugins: [
    {
      name: 'react-hooks-js',
      specifier: 'eslint-plugin-react-hooks',
    },
  ],
  rules: {
    // typescript
    'typescript/array-type': [
      'warn',
      {
        default: 'array-simple',
      },
    ],
    'typescript/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    'typescript/no-floating-promises': 'off',
    // eslint
    'eslint/no-unused-vars': [
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
    // react
    // ref: https://github.com/TheAlexLichter/oxlint-react-compiler-rules/issues/1
    // Recommended rules (from LintRulePreset.Recommended)
    'react-hooks-js/component-hook-factories': 'error',
    'react-hooks-js/config': 'error',
    'react-hooks-js/error-boundaries': 'error',
    'react-hooks-js/gating': 'error',
    'react-hooks-js/globals': 'error',
    'react-hooks-js/immutability': 'error',
    'react-hooks-js/incompatible-library': 'error',
    'react-hooks-js/preserve-manual-memoization': 'error',
    'react-hooks-js/purity': 'error',
    'react-hooks-js/refs': 'error',
    'react-hooks-js/set-state-in-effect': 'warn',
    'react-hooks-js/set-state-in-render': 'error',
    'react-hooks-js/static-components': 'error',
    'react-hooks-js/unsupported-syntax': 'error',
    'react-hooks-js/use-memo': 'error',
    // Recommended-latest rules (from LintRulePreset.RecommendedLatest)
    'react-hooks-js/void-use-memo': 'error',
    // Off rules (LintRulePreset.Off) - not enabled by default
    'react-hooks-js/automatic-effect-dependencies': 'off',
    'react-hooks-js/capitalized-calls': 'off',
    'react-hooks-js/fbt': 'off',
    'react-hooks-js/fire': 'off',
    'react-hooks-js/hooks': 'off',
    'react-hooks-js/invariant': 'off',
    'react-hooks-js/memoized-effect-dependencies': 'off',
    'react-hooks-js/no-deriving-state-in-effects': 'off',
    'react-hooks-js/rule-suppression': 'off',
    'react-hooks-js/syntax': 'off',
    'react-hooks-js/todo': 'off',
  },
});
