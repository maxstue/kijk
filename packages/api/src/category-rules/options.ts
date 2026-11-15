import { invalidate } from '@kijk/api/cache';
import { keepPreviousPageInSpace } from '@kijk/api/paging';
import type { ListQuery } from '@kijk/api/paging';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { remove, getSuggestions, list } from './requests';
import type { CategoryRulePage, CategoryRuleSort } from './types';

/**
 * Query for the remembered category corrections. Tables pass a search, sort and page; selects omit the query to get
 * every row.
 */
export const listQueryOptions = (spaceId: string, query: ListQuery<CategoryRuleSort> = {}) =>
  queryOptions({
    placeholderData: keepPreviousPageInSpace<CategoryRulePage>(spaceId),
    queryFn: ({ signal }) => list(spaceId, query, signal),
    queryKey: queryKeys.categoryRules.list(spaceId, query),
  });

/** Query for rules suggested from repeated manual corrections. */
export const suggestionsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getSuggestions(spaceId, signal),
    queryKey: queryKeys.categoryRules.suggestions(spaceId),
  });

/** Mutation that deletes a remembered category correction. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => remove(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.categoryRules.all(spaceId)),
  });
