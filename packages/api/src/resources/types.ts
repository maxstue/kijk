import type { components } from '@kijk/api/generated/kijk';

/** Payload for creating a resource. */
export type ResourceData = components['schemas']['CreateResourceRequest'];
/** Payload for updating a resource. */
export type UpdateResourceRequest = components['schemas']['UpdateResourceRequest'];

/** Variables of the update-resource mutation. */
export interface UpdateResourceData {
  id: string;
  resource: UpdateResourceRequest;
}
