import { apiClient } from '@kijk/api/client';
import { categoryRulesDelete, categoryRulesList, categoryRulesSuggestions } from '@kijk/api/generated/sdk';
import type { ListQuery } from '@kijk/api/paging';

import type { CategoryRuleSort } from './types';

/** Loads the category rules, optionally searched, sorted and paged. */
export async function list(spaceId: string, query: ListQuery<CategoryRuleSort> = {}, signal?: AbortSignal) {
  return categoryRulesList({ client: apiClient(), path: { spaceId }, query, signal });
}

/** Deletes a remembered category correction; transactions keep their categories. */
export async function remove(spaceId: string, id: string) {
  await categoryRulesDelete({ client: apiClient(), path: { spaceId, id } });
}

/** Loads rules suggested from repeated manual corrections. */
export async function getSuggestions(spaceId: string, signal?: AbortSignal) {
  return categoryRulesSuggestions({ client: apiClient(), path: { spaceId }, signal });
}
