import type { components } from '@/shared/api/generated/kijk';

/** A system or space category. */
export type Category = components['schemas']['CategoryResponse'];
/** Whether a category groups expenses or income. */
export type CategoryKind = components['schemas']['CategoryKind'];
/** Payload for creating a category. */
export type CreateCategoryRequest = components['schemas']['CreateCategoryRequest'];
