import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { setFromMonth, deleteVersion, getOverview, getStatistics, listVersions, updateVersion } from './requests';
import type { SetBudgetRequest, UpdateBudgetData } from './types';

/** Query for all budget versions of the active space. */
export const versionsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => listVersions(spaceId, signal),
    queryKey: queryKeys.budgets.list(spaceId),
  });

/** Query for the budget evaluation of a month (`month` is 1-12). */
export const overviewQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getOverview(spaceId, year, month, signal),
    queryKey: queryKeys.budgets.overview(spaceId, year, month),
  });

/** Query for the spending per category over `months` months that end with the given month. */
export const statisticsQueryOptions = (spaceId: string, year: number, month: number, months: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getStatistics(spaceId, year, month, months, signal),
    queryKey: queryKeys.budgets.statistics(spaceId, year, month, months),
  });

/** Mutation that sets the budget of a category from a month on. */
export const setFromMonthMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: SetBudgetRequest) => setFromMonth(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all(spaceId)),
  });

/** Mutation that updates a budget. */
export const updateVersionMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateBudgetData) => updateVersion(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all(spaceId)),
  });

/** Mutation that deletes a budget. */
export const deleteVersionMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteVersion(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all(spaceId)),
  });
