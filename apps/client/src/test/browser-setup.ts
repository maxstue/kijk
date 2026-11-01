import '@kijk/ui/globals.css';
import { configureApiClient } from '@kijk/api/client';
import { afterAll, afterEach, beforeAll } from 'vite-plus/test';

import { worker } from './mocks/browser';

configureApiClient({ baseUrl: 'http://localhost:5000' });

beforeAll(() =>
  worker.start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) {
        print.error();
      }
    },
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  }),
);

afterEach(() => worker.resetHandlers());
afterAll(() => worker.stop());
