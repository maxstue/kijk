import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';
import { queryKeys } from '@kijk/api/query-keys';
import { queryOptions } from '@tanstack/react-query';

/** Shared finance totals for January through December. */
export const financesQueryOptions = (spaceId: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.finances(spaceId, year),
    queryFn: async ({ signal }) =>
      unwrapApiResponse(
        await apiClient().GET('/api/spaces/{spaceId}/dashboard/finances', {
          params: { path: { spaceId }, query: { year } },
          signal,
        }),
      ),
  });
/** Monthly resource totals for January through December. */
export const consumptionsQueryOptions = (spaceId: string, year: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.consumptions(spaceId, year),
    queryFn: async ({ signal }) =>
      unwrapApiResponse(
        await apiClient().GET('/api/spaces/{spaceId}/dashboard/consumptions', {
          params: { path: { spaceId }, query: { year } },
          signal,
        }),
      ),
  });
/** Current active limit definitions evaluated for the selected calendar period. */
export const limitsQueryOptions = (spaceId: string, year: number, month: number) =>
  queryOptions({
    queryKey: queryKeys.dashboard.limits(spaceId, year, month),
    queryFn: async ({ signal }) =>
      unwrapApiResponse(
        await apiClient().GET('/api/spaces/{spaceId}/dashboard/limits', {
          params: { path: { spaceId }, query: { year, month } },
          signal,
        }),
      ),
  });
