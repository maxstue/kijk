import type { components } from '@/shared/api/generated/kijk';

/** A limit with its current evaluation. */
export type ConsumptionLimit = components['schemas']['ConsumptionLimitResponse'];
/** Payload for creating a limit. */
export type CreateConsumptionLimitRequest = components['schemas']['CreateConsumptionLimitRequest'];
/** Payload for updating a limit. */
export type UpdateConsumptionLimitRequest = components['schemas']['UpdateConsumptionLimitRequest'];

/** Variables of the update-limit mutation. */
export interface UpdateConsumptionLimitData {
  id: string;
  limit: UpdateConsumptionLimitRequest;
}
