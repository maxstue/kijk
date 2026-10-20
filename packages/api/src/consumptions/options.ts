import { invalidate } from '@kijk/api/cache';
import { MONTHS } from '@kijk/api/months';
import { queryKeys } from '@kijk/api/query-keys';
import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { record, remove, exportCsv, exportMonth, getDetails, list, getStatistics, getYears, update } from './requests';
import type { Consumption, ConsumptionData, DeleteConsumptionData, UpdateConsumptionData } from './types';

/** Downloads one consumption or a selected month's consumptions without changing cached data. */
export const exportMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: { consumptionId: string } | { month: string; year: number }) =>
      'consumptionId' in data ? exportCsv(spaceId, data.consumptionId) : exportMonth(spaceId, data.year, data.month),
  });

/** Query for the years that have consumptions. */
export const yearsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryFn: ({ signal }) => getYears(spaceId, signal),
    queryKey: queryKeys.consumptions.years(spaceId),
  });

/** Query for the consumptions of a year/month; omitted values mean all. */
export const listQueryOptions = (spaceId: string, year?: number | string, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => list(spaceId, y, m, signal),
    queryKey: queryKeys.consumptions.by(spaceId, y, m),
  });
};

/** Query for a single consumption. */
export const detailsQueryOptions = (spaceId: string, id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getDetails(spaceId, id, signal),
    queryKey: queryKeys.consumptions.detail(spaceId, id),
  });

/** Query for the statistics of a year and month. */
export const statisticsQueryOptions = (spaceId: string, year?: number | string, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getStatistics(spaceId, y, m, signal),
    queryKey: queryKeys.consumptions.stats(spaceId, y, m),
  });
};

/** Mutation that records a consumption; adds it to the cached list of its month right away. */
export const recordMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: ConsumptionData) => record(spaceId, data),
    onSuccess: async (data, variables, _result, { client }) => {
      const queryKey = consumptionsByKey(spaceId, variables.date);
      const cached = client.getQueryData<Consumption[]>(queryKey);
      if (cached) {
        client.setQueryData(queryKey, [...cached, data]);
      }

      await invalidate(
        client,
        queryKeys.consumptions.byAll(spaceId),
        queryKeys.consumptions.statsAll(spaceId),
        queryKeys.consumptions.years(spaceId),
        queryKeys.limits.all(spaceId),
      );
    },
  });

/** Mutation that updates a consumption; caches the result and patches the cached list of its month. */
export const updateMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: UpdateConsumptionData) => update(spaceId, data.id, data.consumption),
    onSuccess: async (data, variables, _result, { client }) => {
      client.setQueryData(queryKeys.consumptions.detail(spaceId, data.id), data);

      await invalidate(
        client,
        queryKeys.consumptions.byAll(spaceId),
        queryKeys.consumptions.statsAll(spaceId),
        queryKeys.consumptions.years(spaceId),
        queryKeys.limits.all(spaceId),
      );

      const date = variables.consumption.date;
      if (!date) {
        return;
      }

      const queryKey = consumptionsByKey(spaceId, date);
      const cached = client.getQueryData<Consumption[]>(queryKey);
      if (cached) {
        client.setQueryData(
          queryKey,
          cached.map((consumption) => (consumption.id === data.id ? { ...consumption, ...data } : consumption)),
        );
      }
    },
  });

/** Mutation that deletes a consumption. */
export const deleteMutationOptions = (spaceId: string) =>
  mutationOptions({
    mutationFn: (data: DeleteConsumptionData) => remove(spaceId, data.id),
    onSuccess: async (_data, _variables, _result, { client }) => {
      await invalidate(client, queryKeys.consumptions.byAll(spaceId));
      await invalidate(
        client,
        queryKeys.consumptions.statsAll(spaceId),
        queryKeys.consumptions.years(spaceId),
        queryKeys.limits.all(spaceId),
      );
    },
  });

const consumptionsByKey = (spaceId: string, date: Date) =>
  queryKeys.consumptions.by(spaceId, date.getFullYear().toString(), MONTHS[date.getMonth()]);
