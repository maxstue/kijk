import { apiClient } from '@kijk/api/client';
import { categoryRulesDelete, categoryRulesList, categoryRulesSuggestions } from '@kijk/api/generated/sdk';

/** Loads the remembered category corrections of the active space. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return categoryRulesList({ client: apiClient(), path: { spaceId }, signal });
}

/** Deletes a remembered category correction; transactions keep their categories. */
export async function remove(spaceId: string, id: string) {
  await categoryRulesDelete({ client: apiClient(), path: { spaceId, id } });
}

/** Loads rules suggested from repeated manual corrections. */
export async function getSuggestions(spaceId: string, signal?: AbortSignal) {
  return categoryRulesSuggestions({ client: apiClient(), path: { spaceId }, signal });
}
