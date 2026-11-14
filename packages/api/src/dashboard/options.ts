import { apiClient } from '@kijk/api/client';
import { dashboardBudgets, dashboardConsumptions, dashboardFinances, dashboardLimits } from '@kijk/api/generated/sdk';
import { queryKeys } from '@kijk/api/query-keys';
import { queryOptions } from '@tanstack/react-query';

/** Shared finance totals for January through December. */
export const financesQueryOptions = (spaceId: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.finances(spaceId, year),
    queryFn: async ({ signal }) =>
      dashboardFinances({ client: apiClient(), path: { spaceId }, query: { year }, signal }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === spaceId ? previousData : undefined,
  });
/** Monthly resource totals for January through December. */
export const consumptionsQueryOptions = (spaceId: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.consumptions(spaceId, year),
    queryFn: async ({ signal }) =>
      dashboardConsumptions({ client: apiClient(), path: { spaceId }, query: { year }, signal }),
  });
/** Current active limit definitions evaluated for the selected calendar period. */
export const limitsQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.limits(spaceId, year, month),
    queryFn: async ({ signal }) =>
      dashboardLimits({ client: apiClient(), path: { spaceId }, query: { year, month }, signal }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === spaceId ? previousData : undefined,
  });

/** The three shared monthly budgets with the highest utilization. */
export const budgetsQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.budgets(spaceId, year, month),
    queryFn: async ({ signal }) =>
      dashboardBudgets({ client: apiClient(), path: { spaceId }, query: { year, month }, signal }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === spaceId ? previousData : undefined,
  });
