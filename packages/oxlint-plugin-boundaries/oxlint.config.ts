import { sharedIgnorePatterns } from "@kijk/config/oxlint";
import baseConfig from "@kijk/config/oxlint-base";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseConfig],
  ignorePatterns: [...sharedIgnorePatterns],
});
