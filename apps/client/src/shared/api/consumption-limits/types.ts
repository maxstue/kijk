import type { components } from '@/shared/api/generated/kijk';

export type ConsumptionLimit = components['schemas']['ConsumptionLimitResponse'];
export type CreateConsumptionLimitRequest = components['schemas']['CreateConsumptionLimitRequest'];
export type UpdateConsumptionLimitRequest = components['schemas']['UpdateConsumptionLimitRequest'];

export interface UpdateConsumptionLimitData {
  id: string;
  limit: UpdateConsumptionLimitRequest;
}
