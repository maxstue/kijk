import { apiClient } from '@kijk/api/client';
import {
  resourcesCreate,
  resourcesDelete,
  resourcesDetails,
  resourcesList,
  resourcesUpdate,
} from '@kijk/api/generated/sdk';

import type { ResourceData, UpdateResourceData } from './types';

/** Loads the resources of the active space. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return resourcesList({ client: apiClient(), path: { spaceId }, signal });
}

/** Loads a single resource. */
export async function getDetails(spaceId: string, id: string, signal?: AbortSignal) {
  return resourcesDetails({ client: apiClient(), path: { spaceId, id }, signal });
}

/** Creates a custom resource. */
export async function create(spaceId: string, data: ResourceData, signal?: AbortSignal) {
  return resourcesCreate({ client: apiClient(), path: { spaceId }, body: data, signal });
}

/** Updates a custom resource. */
export async function update(spaceId: string, data: UpdateResourceData, signal?: AbortSignal) {
  return resourcesUpdate({ client: apiClient(), body: data.resource, path: { spaceId, id: data.id }, signal });
}

/** Deletes an unused custom resource. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await resourcesDelete({ client: apiClient(), path: { spaceId, id }, signal });
}
