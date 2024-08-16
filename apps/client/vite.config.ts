import path from 'node:path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
// import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      SHORT_APP_VERSION: JSON.stringify(env.npm_package_version.split('-')[0]),
      LONG_APP_VERSION: JSON.stringify(env.npm_package_version),
    },
    resolve: {
      alias: {
        // ts-config paths
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      sourcemap: env.SENTRY_ENABLE === 'true',
      rollupOptions: {
        output: {
          manualChunks: (name) => {
            if (name.includes('node_modules')) {
              return 'vendor';
            }
            return;
          },
        },
      },
    },
    server: {
      port: 5004,
    },
    plugins: [
      TanStackRouterVite(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html}'],
        },
        devOptions: {
          enabled: false,
        },
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'mask-icon.svg',
          'fonts/*.ttf',
          './**/*.png',
          './**/*.svg',
        ],
        manifest: {
          name: 'Kijk',
          short_name: 'Kijk',
          description: ' The open-source household app for effortless financial management and energy monitoring',
          start_url: '/',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: 'maxstue',
        project: 'kijk-client',
        telemetry: env.SENTRY_ENABLE_TELEMETRY === 'true',
        disable: env.SENTRY_ENABLE === 'false',
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
      // checker({
      //   eslint: { lintCommand: 'lint' },
      //   typescript: { tsconfigPath: './tsconfig.json' },
      //   enableBuild: false,
      //   overlay: false,
      // }),
    ],
  };
});
