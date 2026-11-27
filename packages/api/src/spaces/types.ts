import type * as Api from '@kijk/api/generated/types';

/** Payload for creating a shared space. */
export type CreateSpaceData = Api.CreateSpaceRequest;
/** A newly created space. */
export type CreatedSpace = Api.CreateSpaceResponse;
/** Payload for updating space details. */
export type UpdateSpaceData = Api.UpdateSpaceRequest;
/** A space member with role. */
export type SpaceMember = Api.SpaceMemberResponse;
/** A space role and its permissions. */
export type SpaceRole = Api.SpaceRoleResponse;
/** Payload for inviting one person by unique name or e-mail address. */
export type CreateSpaceInvitationData = Api.CreateSpaceInvitationRequest;
/** A pending invitation to a shared space, as the space admins see it. */
export type SpaceInvitation = Api.SpaceInvitationResponse;
