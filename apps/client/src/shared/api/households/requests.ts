import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess } from '@/shared/utils/http';

import type { UpdateHouseholdData } from './types';

export async function updateHousehold(id: string, data: UpdateHouseholdData) {
  return ensureApiSuccess(await apiClient.PUT('/api/households/{id}', { body: data, params: { path: { id } } }));
}

export async function deleteHousehold(id: string) {
  return ensureApiSuccess(await apiClient.DELETE('/api/households/{id}', { params: { path: { id } } }));
}
