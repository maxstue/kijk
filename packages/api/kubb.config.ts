import { pluginFetch } from '@kubb/plugin-fetch';
import { pluginTs } from '@kubb/plugin-ts';
import { defineConfig } from 'kubb/config';

export default defineConfig({
  input: '../../apps/api/src/Api/kijk_openapi.json',
  output: { path: './src/generated', clean: true },
  plugins: [
    pluginTs({ output: { path: './types.ts' }, enum: { type: 'literal' } }),
    pluginFetch({ output: { path: './sdk.ts' }, returnType: 'data' }),
  ],
});
