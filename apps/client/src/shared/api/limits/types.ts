import type { components } from '@/shared/api/generated/kijk';

/** A limit with its current evaluation. */
export type Limit = components['schemas']['LimitResponse'];
/** Payload for creating a limit. */
export type CreateLimitRequest = components['schemas']['CreateLimitRequest'];
/** Payload for updating a limit. */
export type UpdateLimitRequest = components['schemas']['UpdateLimitRequest'];

/** Variables of the update-limit mutation. */
export interface UpdateLimitData {
  id: string;
  limit: UpdateLimitRequest;
}
