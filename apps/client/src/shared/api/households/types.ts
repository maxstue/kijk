import type { components } from '@/shared/api/generated/kijk';

/** Payload for updating household details. */
export type UpdateHouseholdData = components['schemas']['UpdateHouseholdRequest'];
/** A household member with role. */
export type HouseholdMember = components['schemas']['HouseholdMemberResponse'];
/** A household role and its permissions. */
export type HouseholdRole = components['schemas']['HouseholdRoleResponse'];
