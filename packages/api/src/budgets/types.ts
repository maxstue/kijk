import type * as Api from '@kijk/api/generated/types';

/** A budget version: a monthly amount for a category from a month on. */
export type Budget = Api.BudgetResponse;
/** The budget evaluation of a month. */
export type BudgetOverview = Api.BudgetOverviewResponse;
/** The spending of an expense category in the evaluated month. */
export type BudgetCategory = Api.BudgetCategoryResponse;
/** The spending per expense category over several months. */
export type BudgetStatistics = Api.BudgetStatisticsResponse;
/** The spending of an expense category per month. */
export type CategoryTrend = Api.CategoryTrendResponse;
/** Payload for setting the budget of a category from a month on. */
export type SetBudgetRequest = Api.SetBudgetRequest;
/** Payload for updating a budget. */
export type UpdateBudgetRequest = Api.UpdateBudgetRequest;

/** Variables of the update-budget mutation. */
export interface UpdateBudgetData {
  id: string;
  budget: UpdateBudgetRequest;
}
