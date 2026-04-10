import { defineConfig } from "oxlint";

import eslintConfig from "./oxlint/eslint-config.ts";
import typescriptConfig from "./oxlint/typescript-config.ts";
import jsDocConfig from "./oxlint/jsdoc-config.ts";

export default defineConfig({
  extends: [eslintConfig, typescriptConfig, jsDocConfig],
  plugins: ["oxc", "promise", "import", "vitest"],
});
