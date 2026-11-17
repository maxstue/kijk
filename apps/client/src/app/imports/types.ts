import type { ImportCandidatesQuery } from '@kijk/api/imports/types';

/** Review list navigation kept in the URL; month selection and editable import data remain owned by the review. */
export type ReviewQuery = Pick<ImportCandidatesQuery, 'filter' | 'page' | 'search'>;
