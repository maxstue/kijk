import type * as Api from '@kijk/api/generated/types';

/** Payload for creating a resource. */
export type ResourceData = Api.CreateResourceRequest;
/** Payload for updating a resource. */
export type UpdateResourceRequest = Api.UpdateResourceRequest;

/** Variables of the update-resource mutation. */
export interface UpdateResourceData {
  id: string;
  resource: UpdateResourceRequest;
}
