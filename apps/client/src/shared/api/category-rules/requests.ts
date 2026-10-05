import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

/** Loads the remembered category corrections of the active household. */
export async function getCategoryRules(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/category-rules', { signal }));
}

/** Deletes a remembered category correction; transactions keep their categories. */
export async function deleteCategoryRule(id: string) {
  return ensureApiSuccess(await apiClient.DELETE('/api/category-rules/{id}', { params: { path: { id } } }));
}

/** Loads rules suggested from repeated manual corrections. */
export async function getCategoryRuleSuggestions(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/category-rules/suggestions', { signal }));
}
