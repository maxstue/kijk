import type * as Api from '@kijk/api/generated/types';

/** A system or space category. */
export type Category = Api.CategoryResponse;
/** Whether a category groups expenses or income. */
export type CategoryKind = Api.CategoryKind;
/** Payload for creating a category. */
export type CreateCategoryRequest = Api.CreateCategoryRequest;
/** Payload for updating a category. */
export type UpdateCategoryRequest = Api.UpdateCategoryRequest;
