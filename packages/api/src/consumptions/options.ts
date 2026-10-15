import { invalidate } from '@kijk/api/cache';
import { MONTHS } from '@kijk/api/months';
import { queryKeys } from '@kijk/api/query-keys';
import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  createConsumption,
  deleteConsumption,
  getConsumption,
  getConsumptionsBy,
  getConsumptionsStats,
  getYears,
  updateConsumption,
} from './requests';
import type { Consumption, ConsumptionData, DeleteConsumptionData, UpdateConsumptionData } from './types';

/** Query for the years that have consumptions. */
export const consumptionYearsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getYears(signal),
    queryKey: queryKeys.consumptions.years(),
  });

/** Query for the consumptions of a year/month; omitted values mean all. */
export const consumptionsByQueryOptions = (year?: number | string, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getConsumptionsBy(y, m, signal),
    queryKey: queryKeys.consumptions.by(y, m),
  });
};

/** Query for a single consumption. */
export const consumptionQueryOptions = (id: string) =>
  queryOptions({
    queryFn: ({ signal }) => getConsumption(id, signal),
    queryKey: queryKeys.consumptions.detail(id),
  });

/** Query for the statistics of a year and month. */
export const consumptionsStatsQueryOptions = (year?: number | string, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getConsumptionsStats(y, m, signal),
    queryKey: queryKeys.consumptions.stats(y, m),
  });
};

/** Mutation that records a consumption; adds it to the cached list of its month right away. */
export const createConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: ConsumptionData) => createConsumption(data),
    onSuccess: async (data, variables, _result, { client }) => {
      const queryKey = consumptionsByKey(variables.date);
      const cached = client.getQueryData<Consumption[]>(queryKey);
      if (cached) {
        client.setQueryData(queryKey, [...cached, data]);
      }

      await invalidate(client, queryKeys.consumptions.byAll(), queryKeys.consumptions.statsAll(), queryKeys.limits.all);
    },
  });

/** Mutation that updates a consumption; caches the result and patches the cached list of its month. */
export const updateConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateConsumptionData) => updateConsumption(data.id, data.consumption),
    onSuccess: async (data, variables, _result, { client }) => {
      client.setQueryData(queryKeys.consumptions.detail(data.id), data);

      await invalidate(client, queryKeys.consumptions.byAll(), queryKeys.consumptions.statsAll(), queryKeys.limits.all);

      const date = variables.consumption.date;
      if (!date) {
        return;
      }

      const queryKey = consumptionsByKey(date);
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
export const deleteConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: DeleteConsumptionData) => deleteConsumption(data.id),
    onSuccess: async (_data, _variables, _result, { client }) => {
      await invalidate(client, queryKeys.consumptions.byAll());
      await invalidate(client, queryKeys.consumptions.statsAll(), queryKeys.limits.all);
    },
  });

const consumptionsByKey = (date: Date) =>
  queryKeys.consumptions.by(date.getFullYear().toString(), MONTHS[date.getMonth()]);
