import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

/** A build fixture using real feature code, not another deployed web application. */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  publicDir: false,
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  build: { outDir: '../dist-desktop-check', emptyOutDir: true },
  plugins: [
    {
      name: 'shared-app-boundary',
      resolveId(source) {
        if (
          source.startsWith('@tanstack/react-start') ||
          source.startsWith('@clerk/') ||
          source.startsWith('@/server/')
        ) {
          throw new Error(`The shared application must not import a web server or auth SDK: ${source}`);
        }
      },
    },
    react(),
    tailwindcss(),
  ],
});
