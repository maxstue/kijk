import { keepPreviousData, mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import {
  createConsumption,
  deleteConsumption,
  getConsumptionsBy,
  getConsumptionsStats,
  getYears,
  updateConsumption,
} from './requests';
import type { ConsumptionData, DeleteConsumptionData, UpdateConsumptionData } from './types';

export const consumptionYearsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getYears(signal),
    queryKey: queryKeys.consumptions.years(),
  });

export const consumptionsByQueryOptions = (year?: number | string, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getConsumptionsBy(y, m, signal),
    queryKey: queryKeys.consumptions.by(y, m),
  });
};

export const consumptionsStatsQueryOptions = (year?: number | string, month?: string) => {
  const y = year ? year.toString() : undefined;
  const m = month ?? undefined;

  return queryOptions({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getConsumptionsStats(y, m, signal),
    queryKey: queryKeys.consumptions.stats(y, m),
  });
};

export const createConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: ConsumptionData) => createConsumption(data),
  });

export const updateConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateConsumptionData) => updateConsumption(data.id, data.consumption),
  });

export const deleteConsumptionMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: DeleteConsumptionData) => deleteConsumption(data.id),
  });
