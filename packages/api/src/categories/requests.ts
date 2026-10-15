import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

/** Loads the system categories and the active space's own categories. */
export async function getCategories(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/categories', { params: { path: { spaceId } }, signal }),
  );
}

/** Creates a custom category. */
export async function createCategory(spaceId: string, data: CreateCategoryRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/categories', { params: { path: { spaceId } }, body: data, signal }),
  );
}

/** Updates a custom category. */
export async function updateCategory(spaceId: string, id: string, data: UpdateCategoryRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/categories/{id}', {
      body: data,
      params: { path: { spaceId, id } },
      signal,
    }),
  );
}

/** Deletes an unused custom category. */
export async function deleteCategory(spaceId: string, id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/spaces/{spaceId}/categories/{id}', { params: { path: { spaceId, id } }, signal });
}
