import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

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
export const budgetsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getBudgets(signal),
    queryKey: queryKeys.budgets.list(),
  });

/** Query for the budget evaluation of a month (`month` is 1-12). */
export const budgetOverviewQueryOptions = (year: number, month: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getBudgetOverview(year, month, signal),
    queryKey: queryKeys.budgets.overview(year, month),
  });

/** Query for the spending per category over `months` months that end with the given month. */
export const budgetStatisticsQueryOptions = (year: number, month: number, months: number) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getBudgetStatistics(year, month, months, signal),
    queryKey: queryKeys.budgets.statistics(year, month, months),
  });

/** Mutation that creates a budget. */
export const createBudgetMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateBudgetRequest) => createBudget(data),
  });

/** Mutation that updates a budget. */
export const updateBudgetMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateBudgetData) => updateBudget(data),
  });

/** Mutation that deletes a budget. */
export const deleteBudgetMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteBudget(id),
  });
