import type * as Api from '@kijk/api/generated/types';
import type { ListQuery } from '@kijk/api/paging';

/** A limit with its current evaluation. */
export type Limit = Api.LimitResponse;
/** Payload for creating a limit. */
export type CreateLimitRequest = Api.CreateLimitRequest;
/** Payload for updating a limit. */
export type UpdateLimitRequest = Api.UpdateLimitRequest;

/** Variables of the update-limit mutation. */
export interface UpdateLimitData {
  id: string;
  limit: UpdateLimitRequest;
}

/** Sort columns of the list. */
export type LimitSort = Api.LimitSort;
/** Server-side list filters and page. */
export interface LimitsQuery extends ListQuery<LimitSort> {
  resourceId?: string;
  period?: Api.Period;
}
