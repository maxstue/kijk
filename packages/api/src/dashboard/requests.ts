import { apiClient } from '@kijk/api/client';
import { dashboardBudgets, dashboardConsumptions, dashboardFinances, dashboardLimits } from '@kijk/api/generated/sdk';

/** Loads the shared finance totals for January through December of a year. */
export async function getFinances(spaceId: string, year: number, signal?: AbortSignal) {
  return dashboardFinances({ client: apiClient(), path: { spaceId }, query: { year }, signal });
}

/** Loads the monthly resource totals for January through December of a year. */
export async function getConsumptions(spaceId: string, year: number, signal?: AbortSignal) {
  return dashboardConsumptions({ client: apiClient(), path: { spaceId }, query: { year }, signal });
}

/** Loads the active limit definitions evaluated for a calendar month. */
export async function getLimits(spaceId: string, year: number, month: number, signal?: AbortSignal) {
  return dashboardLimits({ client: apiClient(), path: { spaceId }, query: { year, month }, signal });
}

/** Loads the three shared monthly budgets with the highest utilization. */
export async function getBudgets(spaceId: string, year: number, month: number, signal?: AbortSignal) {
  return dashboardBudgets({ client: apiClient(), path: { spaceId }, query: { year, month }, signal });
}
