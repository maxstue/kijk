import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { deleteCategoryRule, getCategoryRuleSuggestions, getCategoryRules } from './requests';

/** Query for the remembered category corrections. */
export const categoryRulesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCategoryRules(signal),
    queryKey: queryKeys.categoryRules.list(),
  });

/** Query for rules suggested from repeated manual corrections. */
export const categoryRuleSuggestionsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCategoryRuleSuggestions(signal),
    queryKey: queryKeys.categoryRules.suggestions(),
  });

/** Mutation that deletes a remembered category correction. */
export const deleteCategoryRuleMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteCategoryRule(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categoryRules.all),
  });
