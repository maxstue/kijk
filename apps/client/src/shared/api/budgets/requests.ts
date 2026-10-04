import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { CreateBudgetRequest, UpdateBudgetData } from './types';

/** Loads all budget versions of the active household. */
export async function getBudgets(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/budgets', { signal }));
}

/** Loads the budget evaluation of a calendar month (`month` is 1-12). */
export async function getBudgetOverview(year: number, month: number, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.GET('/api/budgets/overview', { params: { query: { month, year } }, signal }),
  );
}

/** Creates a budget for a category from a month on. */
export async function createBudget(data: CreateBudgetRequest, signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.POST('/api/budgets', { body: data, signal }));
}

/** Updates the amount or active state of a budget version. */
export async function updateBudget(data: UpdateBudgetData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/budgets/{id}', { body: data.budget, params: { path: { id: data.id } }, signal }),
  );
}

/** Deletes a budget version. */
export async function deleteBudget(id: string, signal?: AbortSignal) {
  return ensureApiSuccess(await apiClient.DELETE('/api/budgets/{id}', { params: { path: { id } }, signal }));
}
