import type { components } from '@/shared/api/generated/kijk';

/** Payload for updating space details. */
export type UpdateSpaceData = components['schemas']['UpdateSpaceRequest'];
/** A space member with role. */
export type SpaceMember = components['schemas']['SpaceMemberResponse'];
/** A space role and its permissions. */
export type SpaceRole = components['schemas']['SpaceRoleResponse'];
