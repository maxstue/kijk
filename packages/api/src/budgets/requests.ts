import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { CreateBudgetRequest, UpdateBudgetData } from './types';

/** Loads all budget versions of the active space. */
export async function getBudgets(spaceId: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/budgets', { params: { path: { spaceId } }, signal }),
  );
}

/** Loads the budget evaluation of a calendar month (`month` is 1-12). */
export async function getBudgetOverview(spaceId: string, year: number, month: number, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/budgets/overview', {
      params: { path: { spaceId }, query: { month, year } },
      signal,
    }),
  );
}

/** Loads the spending per category for `months` months that end with the given month (`month` is 1-12). */
export async function getBudgetStatistics(
  spaceId: string,
  year: number,
  month: number,
  months: number,
  signal?: AbortSignal,
) {
  return unwrapApiResponse(
    await apiClient().GET('/api/spaces/{spaceId}/budgets/statistics', {
      params: { path: { spaceId }, query: { month, months, year } },
      signal,
    }),
  );
}

/** Creates a budget for a category from a month on. */
export async function createBudget(spaceId: string, data: CreateBudgetRequest, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().POST('/api/spaces/{spaceId}/budgets', { params: { path: { spaceId } }, body: data, signal }),
  );
}

/** Updates the amount or active state of a budget version. */
export async function updateBudget(spaceId: string, data: UpdateBudgetData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/spaces/{spaceId}/budgets/{id}', {
      body: data.budget,
      params: { path: { spaceId, id: data.id } },
      signal,
    }),
  );
}

/** Deletes a budget version. */
export async function deleteBudget(spaceId: string, id: string, signal?: AbortSignal) {
  await apiClient().DELETE('/api/spaces/{spaceId}/budgets/{id}', { params: { path: { spaceId, id } }, signal });
}
