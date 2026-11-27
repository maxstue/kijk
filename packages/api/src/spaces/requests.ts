import { apiClient } from '@kijk/api/client';
import {
  spacesChangeMemberRole,
  spacesCreate,
  spacesCreateInvitation,
  spacesDelete,
  spacesInvitations,
  spacesMembers,
  spacesRevokeInvitation,
  spacesRoles,
  spacesUpdate,
} from '@kijk/api/generated/sdk';

import type { CreateSpaceData, CreateSpaceInvitationData, UpdateSpaceData } from './types';

/** Creates a shared space with the current user as admin and returns it. */
export async function create(data: CreateSpaceData) {
  return spacesCreate({ client: apiClient(), body: data });
}

/** Updates the details of a space. */
export async function update(id: string, data: UpdateSpaceData) {
  await spacesUpdate({ client: apiClient(), body: data, path: { id } });
}

/** Deletes a space and all of its data. */
export async function remove(id: string) {
  await spacesDelete({ client: apiClient(), path: { id } });
}

/** Loads the space roles and their permissions. */
export async function getRoles(signal?: AbortSignal) {
  return spacesRoles({ client: apiClient(), signal });
}

/** Loads the members of a space with their roles. */
export async function getMembers(id: string, signal?: AbortSignal) {
  return spacesMembers({ client: apiClient(), path: { id }, signal });
}

/** Changes the role of another space member and returns the updated member. */
export async function changeMemberRole(id: string, userId: string, roleId: string) {
  return spacesChangeMemberRole({ client: apiClient(), body: { roleId }, path: { id, userId } });
}

/** Loads the pending invitations of a space, newest first. */
export async function getInvitations(id: string, signal?: AbortSignal) {
  return spacesInvitations({ client: apiClient(), path: { id }, signal });
}

/** Invites one person into a shared space by unique name or e-mail address and returns the invitation. */
export async function createInvitation(id: string, data: CreateSpaceInvitationData) {
  return spacesCreateInvitation({ client: apiClient(), body: data, path: { id } });
}

/** Revokes a pending invitation of a space. */
export async function revokeInvitation(id: string, invitationId: string) {
  await spacesRevokeInvitation({ client: apiClient(), path: { id, invitationId } });
}
