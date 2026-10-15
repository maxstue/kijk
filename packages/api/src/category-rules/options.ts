import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { deleteCategoryRule, getCategoryRuleSuggestions, getCategoryRules } from './requests';

/** Query for the remembered category corrections. */
export const categoryRulesQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getCategoryRules(spaceId, signal),
    queryKey: queryKeys.categoryRules.list(spaceId),
  });

/** Query for rules suggested from repeated manual corrections. */
export const categoryRuleSuggestionsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getCategoryRuleSuggestions(spaceId, signal),
    queryKey: queryKeys.categoryRules.suggestions(spaceId),
  });

/** Mutation that deletes a remembered category correction. */
export const deleteCategoryRuleMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteCategoryRule(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categoryRules.all(spaceId)),
  });
