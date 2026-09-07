import { afterAll, afterEach, beforeAll } from 'vitest';

import { worker } from './mocks/browser';

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
