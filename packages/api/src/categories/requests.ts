import { apiClient } from '@kijk/api/client';
import { categoriesCreate, categoriesDelete, categoriesList, categoriesUpdate } from '@kijk/api/generated/sdk';

import type { CreateCategoryRequest, UpdateCategoryRequest } from './types';

/** Loads the system categories and the active space's own categories. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return categoriesList({ client: apiClient(), path: { spaceId }, signal });
}

/** Creates a custom category. */
export async function create(spaceId: string, data: CreateCategoryRequest, signal?: AbortSignal) {
  return categoriesCreate({ client: apiClient(), path: { spaceId }, body: data, signal });
}

/** Updates a custom category. */
export async function update(spaceId: string, id: string, data: UpdateCategoryRequest, signal?: AbortSignal) {
  return categoriesUpdate({ client: apiClient(), body: data, path: { spaceId, id }, signal });
}

/** Deletes an unused custom category. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await categoriesDelete({ client: apiClient(), path: { spaceId, id }, signal });
}
