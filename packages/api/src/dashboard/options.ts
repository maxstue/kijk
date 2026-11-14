import { queryKeys } from '@kijk/api/query-keys';
import { queryOptions } from '@tanstack/react-query';

import { getBudgets, getConsumptions, getFinances, getLimits } from './requests';

/** Shared finance totals for January through December. */
export const financesQueryOptions = (spaceId: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.finances(spaceId, year),
    queryFn: ({ signal }) => getFinances(spaceId, year, signal),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === spaceId ? previousData : undefined,
  });
/** Monthly resource totals for January through December. */
export const consumptionsQueryOptions = (spaceId: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.consumptions(spaceId, year),
    queryFn: ({ signal }) => getConsumptions(spaceId, year, signal),
  });
/** Current active limit definitions evaluated for the selected calendar period. */
export const limitsQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.limits(spaceId, year, month),
    queryFn: ({ signal }) => getLimits(spaceId, year, month, signal),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === spaceId ? previousData : undefined,
  });

/** The three shared monthly budgets with the highest utilization. */
export const budgetsQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.budgets(spaceId, year, month),
    queryFn: ({ signal }) => getBudgets(spaceId, year, month, signal),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === spaceId ? previousData : undefined,
  });
