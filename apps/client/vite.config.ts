import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import checker from 'vite-plugin-checker';
import { createHtmlPlugin } from 'vite-plugin-html';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';

import devManifest from './public/dev/site.json';
import prodManifest from './public/prod/site.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const iconPath = mode === 'development' ? '/dev' : '/prod';

  return {
    define: {
      SHORT_APP_VERSION: JSON.stringify(env.npm_package_version.split('-')[0]),
      LONG_APP_VERSION: JSON.stringify(env.npm_package_version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: env.SENTRY_ENABLE === 'true',
    },
    server: {
      port: 5004,
    },
    plugins: [
      react(),
      TanStackRouterVite(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false,
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: mode === 'development' ? (devManifest as ManifestOptions) : (prodManifest as ManifestOptions),
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            MODE: mode,
            injectLogos: `
                <link rel="icon" href="${iconPath}/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" sizes="180x180" href="${iconPath}/apple-touch-icon.png" />
                <link rel="icon" href="${iconPath}/favicon-32x32.png" type="image/png" sizes="32x32" />
                <link rel="icon" href="${iconPath}/favicon-16x16.png" type="image/png" sizes="16x16" />
                `,
          },
        },
      }),
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: 'maxstue',
        project: 'kijk-client',
        telemetry: env.SENTRY_ENABLE_TELEMETRY === 'true',
        disable: env.SENTRY_ENABLE === 'false',
      }),
      checker({
        eslint: { lintCommand: 'lint' },
        typescript: { tsconfigPath: './tsconfig.json' },
        enableBuild: false,
        overlay: false,
      }),
    ],
  };
});

// function pwaManifest(mode: string, version: string) {
//   // return {
//   //   icons: [
//   //     {
//   //       src: `/android-chrome-192x192.png?v=${version}`,
//   //       sizes: '192x192',
//   //       type: 'image/png',
//   //     },
//   //     {
//   //       src: `/android-chrome-512x512.png?v=${version}`,
//   //       sizes: '512x512',
//   //       type: 'image/png',
//   //       purpose: 'any',
//   //     },
//   //     {
//   //       src: `/android-chrome-512x512.png?v=${version}`,
//   //       sizes: '512x512',
//   //       type: 'image/png',
//   //       purpose: 'maskable',
//   //     },
//   //   ],
//   // } satisfies Partial<ManifestOptions>;

//   return {
//     name: 'Kijk',
//     short_name: 'Kijk',
//     description: ' The open-source household app for effortless financial management and energy monitoring',
//     start_url: '/',
//     lang: 'en-GB',
//     orientation: 'any',
//     display: 'standalone',
//     background_color: '#FFFFFF',
//     theme_color: '#FFFFFF',
//     icons:
//       mode === 'development'
//         ? (devManifest.icons as any[])
//         : [
//             {
//               src: '/pwa-192x192.png',
//               sizes: '192x192',
//               type: 'image/png',
//               purpose: 'any',
//             },
//             {
//               src: '/pwa-512x512.png',
//               sizes: '512x512',
//               type: 'image/png',
//               purpose: 'any',
//             },
//             {
//               src: '/pwa-maskable-192x192.png',
//               sizes: '192x192',
//               type: 'image/png',
//               purpose: 'maskable',
//             },
//             {
//               src: '/pwa-maskable-512x512.png',
//               sizes: '512x512',
//               type: 'image/png',
//               purpose: 'maskable',
//             },
//           ],
//   } satisfies Partial<ManifestOptions>;
// }
