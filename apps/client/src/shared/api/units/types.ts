import type { components } from '@/shared/api/generated/kijk';

/** A unit as seen by the current user. */
export type Unit = components['schemas']['UnitResponse'];
/** Payload for creating a unit. */
export type CreateUnitData = components['schemas']['CreateUnitRequest'];
/** Payload for updating a unit. */
export type UpdateUnitData = components['schemas']['UpdateUnitRequest'];
