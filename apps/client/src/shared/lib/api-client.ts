import { configureApiClient } from '@kijk/api/client';

/** Uses the web app's same-origin BFF; credentials and upstream tokens are handled by the server. */
export function setupApiClient() {
  configureApiClient({ baseUrl: globalThis.location.origin });
}
