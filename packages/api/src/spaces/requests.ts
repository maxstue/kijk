import { apiClient } from '@kijk/api/client';
import {
  spacesChangeMemberRole,
  spacesDelete,
  spacesMembers,
  spacesRoles,
  spacesUpdate,
} from '@kijk/api/generated/sdk';

import type { UpdateSpaceData } from './types';

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
