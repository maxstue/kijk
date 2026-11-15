import { apiClient } from '@kijk/api/client';
import { unitsList } from '@kijk/api/generated/sdk';

/** Loads the system unit catalog. */
export async function list(signal?: AbortSignal) {
  return unitsList({ client: apiClient(), signal });
}
