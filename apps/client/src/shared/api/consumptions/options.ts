import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import {
  createConsumption,
  deleteConsumption,
  getConsumption,
  getConsumptionsBy,
  getConsumptionsStats,
  getYears,
  updateConsumption,
} from './requests';
import type { ConsumptionData, DeleteConsumptionData, UpdateConsumptionData } from './types';

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

/** Mutation that records a consumption. */
export const createConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: ConsumptionData) => createConsumption(data),
  });

/** Mutation that updates a consumption. */
export const updateConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateConsumptionData) => updateConsumption(data.id, data.consumption),
  });

/** Mutation that deletes a consumption. */
export const deleteConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: DeleteConsumptionData) => deleteConsumption(data.id),
  });
