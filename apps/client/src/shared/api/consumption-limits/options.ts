import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { createConsumptionLimit, getConsumptionLimits, updateConsumptionLimit } from './requests';
import type { CreateConsumptionLimitRequest, UpdateConsumptionLimitData } from './types';

/** Query for the limits of the active household. */
export const consumptionLimitsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getConsumptionLimits(signal),
    queryKey: queryKeys.consumptionLimits.list(),
  });

/** Mutation that creates a limit. */
export const createConsumptionLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateConsumptionLimitRequest) => createConsumptionLimit(data),
  });

/** Mutation that updates a limit. */
export const updateConsumptionLimitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: UpdateConsumptionLimitData) => updateConsumptionLimit(data),
  });
