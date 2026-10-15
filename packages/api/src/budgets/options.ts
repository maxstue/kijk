import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  createBudget,
  deleteBudget,
  getBudgetOverview,
  getBudgetStatistics,
  getBudgets,
  updateBudget,
} from './requests';
import type { CreateBudgetRequest, UpdateBudgetData } from './types';

/** Query for all budget versions of the active space. */
export const budgetsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getBudgets(spaceId, signal),
    queryKey: queryKeys.budgets.list(spaceId),
  });

/** Query for the budget evaluation of a month (`month` is 1-12). */
export const budgetOverviewQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getBudgetOverview(spaceId, year, month, signal),
    queryKey: queryKeys.budgets.overview(spaceId, year, month),
  });

/** Query for the spending per category over `months` months that end with the given month. */
export const budgetStatisticsQueryOptions = (spaceId: string, year: number, month: number, months: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getBudgetStatistics(spaceId, year, month, months, signal),
    queryKey: queryKeys.budgets.statistics(spaceId, year, month, months),
  });

/** Mutation that creates a budget. */
export const createBudgetMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: CreateBudgetRequest) => createBudget(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all(spaceId)),
  });

/** Mutation that updates a budget. */
export const updateBudgetMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateBudgetData) => updateBudget(spaceId, data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all(spaceId)),
  });

/** Mutation that deletes a budget. */
export const deleteBudgetMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (id: string) => deleteBudget(spaceId, id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all(spaceId)),
  });
