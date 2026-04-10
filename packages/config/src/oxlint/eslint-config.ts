import { defineConfig } from "oxlint";

/**
 * OxLint configuration for ESLint rules.
 */
export default defineConfig({
  plugins: ["eslint"],
  rules: {
    "eslint/no-unused-vars": [
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
  },
});
