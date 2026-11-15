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

/** Resources available in the active space; one page of them when the query names a page. */
export type ResourcePage = Api.PageResponseOfResourceResponse;
/** The columns the resource list can be sorted by. */
export type ResourceSort = Api.ResourceSort;
