import { createStartHandler, defaultStreamHandler, handleStartError } from '@tanstack/react-start/server';
import { createServerEntry } from '@tanstack/react-start/server-entry';

import { captureServerError, startServerSpan } from './server/telemetry';

const handleRequest = createStartHandler(defaultStreamHandler);

/** Server-only lifecycle; request state stays inside Start's request context. */
export default createServerEntry({
  async fetch(request, options) {
    const span = startServerSpan(request);
    try {
      const response = await handleRequest(request, options);
      span?.setAttribute('http.response.status_code', response.status);
      // Clerk may serialize signed-in state even into an otherwise public page.
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch (error) {
      span?.setAttribute('http.response.status_code', 500);
      captureServerError(error);
      return handleStartError(error);
    } finally {
      span?.end();
    }
  },
});
