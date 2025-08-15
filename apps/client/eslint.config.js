// @ts-check
import eslint from "@eslint/js";
import { tanstackConfig } from '@tanstack/eslint-config'
import prettierConfig from "eslint-config-prettier";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import oxlint from 'eslint-plugin-oxlint';

/** @type {import('typescript-eslint').ConfigWithExtends} */
const baseESLintConfig = {
  name: "eslint",
  extends: [eslint.configs.recommended],
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const disableTypeChecked = {
  name: "disableTypeChecked",
  files: ["**/*.js"],
  extends: [tseslint.configs.disableTypeChecked],
  rules: {
    "@typescript-eslint/internal/no-poorly-typed-ts-props": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const typescriptConfig = {
  name: "typescript",
  extends: [
    ...tseslint.configs.stylisticTypeChecked,
    ...tseslint.configs.recommendedTypeChecked,
  ],
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { modules: true, jsx: true },
      jsxPragma: undefined,
      project: true,
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
      projectFolderIgnoreList: ["**/node_modules/**"],
    },
    globals: {
      ...globals.builtin,
      ...globals.browser,
      ...globals.es2025,
      ...globals.serviceworker,
    },
  },
  linterOptions: {
    reportUnusedDisableDirectives: "error",
  },
  rules: {
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      { allowNumber: true },
    ],
    "@typescript-eslint/no-unnecessary-type-parameters": "off",
    "@typescript-eslint/only-throw-error": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/no-import-type-side-effects": "warn",
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/no-empty-interface": [
      "error",
      {
        allowSingleExtends: true,
      },
    ],
  },
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const ignoreFiles = {
  name: "ignoreFiles",
  ignores: [
    "**/.vscode/**",
    "**/public/**",
    "**/config/**",
    "**/dist/**",
    "**/dev-dist/**",
    "**/**.eslint.**",
    "**/tailwind.config.ts",
    "src/routeTree.gen.ts",
  ],
};

/** @type {import('typescript-eslint').ConfigWithExtends} */
const onlyFiles = {
  name: "onlyFiles",
  files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
};

export default tseslint.config(
  baseESLintConfig,
  typescriptConfig,
  prettierConfig,
  reactHooksPlugin.configs["recommended-latest"],
  tanstackConfig,
  disableTypeChecked,
  ignoreFiles,
  onlyFiles,
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
);
