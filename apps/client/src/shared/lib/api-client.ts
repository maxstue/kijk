import { configureApiClient } from '@kijk/api/client';

/** Required on every relayed request; cross-site pages cannot set a custom header without a CORS preflight. */
export const bffRequestHeader = { name: 'X-CSRF', value: '1' } as const;

/** Uses the web app's same-origin BFF; credentials and upstream tokens are handled by the server. */
export function setupApiClient() {
  configureApiClient({
    baseUrl: globalThis.location.origin,
    headers: { [bffRequestHeader.name]: bffRequestHeader.value },
  });
}
