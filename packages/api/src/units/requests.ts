import { apiClient } from '@kijk/api/client';
import {
  unitsArchive,
  unitsCreate,
  unitsDelete,
  unitsList,
  unitsRemoveFromSpace,
  unitsRestore,
  unitsShareWithSpace,
  unitsUpdate,
} from '@kijk/api/generated/sdk';

import type { CreateUnitData, UnitListQuery, UpdateUnitData } from './types';

/** Loads the units of a scope, optionally filtered and paged. */
export async function list(query: UnitListQuery, signal?: AbortSignal) {
  return unitsList({ client: apiClient(), query, signal });
}

/** Creates a unit owned by the user. */
export async function create(data: CreateUnitData) {
  return unitsCreate({ client: apiClient(), body: data });
}

/** Updates a unit owned by the user. */
export async function update(id: string, data: UpdateUnitData) {
  return unitsUpdate({ client: apiClient(), body: data, path: { id } });
}

/** Archives a unit. */
export async function archive(id: string) {
  await unitsArchive({ client: apiClient(), path: { id } });
}

/** Restores an archived unit. */
export async function restore(id: string) {
  await unitsRestore({ client: apiClient(), path: { id } });
}

/** Deletes an unused, unshared unit. */
export async function remove(id: string) {
  await unitsDelete({ client: apiClient(), path: { id } });
}

/** Shares a unit with a space. */
export async function shareWithSpace(id: string, spaceId: string) {
  await unitsShareWithSpace({ client: apiClient(), path: { spaceId, id } });
}

/** Removes a unit from a space. */
export async function removeFromSpace(id: string, spaceId: string) {
  await unitsRemoveFromSpace({ client: apiClient(), path: { spaceId, id } });
}
