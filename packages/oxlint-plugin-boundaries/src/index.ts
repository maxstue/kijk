import { noCrossFeatureImports } from "./rules/no-cross-feature-imports.ts";

/**
 * Oxlint plugin that exposes boundary rules for Kijk workspace packages.
 *
 * @see https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html
 */
export default {
  meta: {
    name: "@kijk/oxlint-plugin-boundaries",
  },
  rules: {
    "no-cross-feature-imports": noCrossFeatureImports,
  },
};
