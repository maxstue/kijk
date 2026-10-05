import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { deleteCategoryRule, getCategoryRules } from './requests';

/** Query for the remembered category corrections. */
export const categoryRulesQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCategoryRules(signal),
    queryKey: queryKeys.categoryRules.list(),
  });

/** Mutation that deletes a remembered category correction. */
export const deleteCategoryRuleMutationOptions = () =>
  mutationOptions({ mutationFn: (id: string) => deleteCategoryRule(id) });
