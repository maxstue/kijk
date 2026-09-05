import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { createConsumptionLimit, getConsumptionLimits, updateConsumptionLimit } from './requests';
import type { CreateConsumptionLimitRequest, UpdateConsumptionLimitData } from './types';

export const consumptionLimitsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getConsumptionLimits(signal),
    queryKey: queryKeys.consumptionLimits.list(),
  });

export const createConsumptionLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateConsumptionLimitRequest) => createConsumptionLimit(data),
  });

export const updateConsumptionLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateConsumptionLimitData) => updateConsumptionLimit(data),
  });
