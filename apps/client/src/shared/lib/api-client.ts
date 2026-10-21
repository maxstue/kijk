import { configureApiClient } from '@kijk/api/client';

import { config } from '@/shared/config';
import { getAuthToken } from '@/shared/lib/auth-client';

/** Points the shared API client at the configured backend and authenticates requests with the Clerk session. */
export function setupApiClient() {
  configureApiClient({ baseUrl: config.BaseApiUrl, getAuthToken });
}
