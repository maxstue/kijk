import type * as Api from '@kijk/api/generated/types';

/** A unit as seen by the current user. */
export type Unit = Api.UnitResponse;
/** Which units a unit list contains; system units are part of every scope. */
export type UnitScope = Api.UnitScope;
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
export type CreateUnitData = Api.CreateUnitRequest;
/** Payload for updating a unit. */
export type UpdateUnitData = Api.UpdateUnitRequest;
