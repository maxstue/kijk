import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

/** Loads the system categories and the active space's own categories. */
export async function getCategories(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/categories', { signal }));
}

/** Creates a custom category. */
export async function createCategory(data: CreateCategoryRequest, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.POST('/api/categories', { body: data, signal }));
}

/** Updates a custom category. */
export async function updateCategory(id: string, data: UpdateCategoryRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/categories/{id}', { body: data, params: { path: { id } }, signal }),
  );
}

/** Deletes an unused custom category. */
export async function deleteCategory(id: string, signal?: AbortSignal) {
  return ensureApiSuccess(await apiClient.DELETE('/api/categories/{id}', { params: { path: { id } }, signal }));
}
