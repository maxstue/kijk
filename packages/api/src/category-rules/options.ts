import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { remove, getSuggestions, list } from './requests';

/** Query for the remembered category corrections. */
export const listQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => list(spaceId, signal),
    queryKey: queryKeys.categoryRules.list(spaceId),
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
