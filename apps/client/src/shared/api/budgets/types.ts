import type { components } from '@/shared/api/generated/kijk';

/** A budget version: a monthly amount for a category from a month on. */
export type Budget = components['schemas']['BudgetResponse'];
/** The budget evaluation of a month. */
export type BudgetOverview = components['schemas']['BudgetOverviewResponse'];
/** The spending of an expense category in the evaluated month. */
export type BudgetCategory = components['schemas']['BudgetCategoryResponse'];
/** Payload for creating a budget. */
export type CreateBudgetRequest = components['schemas']['CreateBudgetRequest'];
/** Payload for updating a budget. */
export type UpdateBudgetRequest = components['schemas']['UpdateBudgetRequest'];

/** Variables of the update-budget mutation. */
export interface UpdateBudgetData {
  id: string;
  budget: UpdateBudgetRequest;
}
