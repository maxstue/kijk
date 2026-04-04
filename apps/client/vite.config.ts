import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { devtools as tanstackDevtools } from "@tanstack/devtools-vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import babel from "@rolldown/plugin-babel";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    build: {
      sourcemap: env.SENTRY_ENABLE === "true",
      rolldownOptions: {
        devtools: {}, // enable devtools mode
      },
    },
    server: {
      port: 5004,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      // TODO make it configurable via env variable
      // viteDevTools({ builtinDevTools: false }),
      tanstackDevtools({
        removeDevtoolsOnBuild: true,
      }),
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: "maxstue",
        project: "kijk-client",
        telemetry: env.SENTRY_ENABLE_TELEMETRY === "true",
        disable: env.SENTRY_ENABLE === "false",
        sourcemaps: {
          filesToDeleteAfterUpload: ["./dist/**/*.map"],
        },
      }),
    ],
  };
});
