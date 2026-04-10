import { defineConfig } from "oxlint";

/**
 * OxLint configuration for Typescript rules.
 */
export default defineConfig({
  plugins: ["typescript"],
  rules: {
    "typescript/array-type": ["warn", { default: "array-simple" }],
    "typescript/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    "typescript/no-floating-promises": "off",
  },
});
