import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

/** Loads the remembered category corrections of the active space. */
export async function getCategoryRules(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/spaces/{spaceId}/category-rules', { params: { path: { spaceId } }, signal }));
}

/** Deletes a remembered category correction; transactions keep their categories. */
export async function deleteCategoryRule(spaceId: string, id: string) {
  await apiClient().DELETE('/api/spaces/{spaceId}/category-rules/{id}', { params: { path: { spaceId, id } } });
}

/** Loads rules suggested from repeated manual corrections. */
export async function getCategoryRuleSuggestions(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/spaces/{spaceId}/category-rules/suggestions', { params: { path: { spaceId } }, signal }));
}
