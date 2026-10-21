import type { components } from '@kijk/api/generated/kijk';

/** A unit as seen by the current user. */
export type Unit = components['schemas']['UnitResponse'];
/** Which units a unit list contains; system units are part of every scope. */
export type UnitScope = components['schemas']['UnitScope'];
/** Scope, filters and page of a unit list; without a page size, all units are returned. */
export interface UnitListQuery {
  scope: UnitScope;
  spaceId?: string;
  includeArchived?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}
/** Payload for creating a unit. */
export type CreateUnitData = components['schemas']['CreateUnitRequest'];
/** Payload for updating a unit. */
export type UpdateUnitData = components['schemas']['UpdateUnitRequest'];
