import type { ImportCandidatesQuery } from '@kijk/api/imports/types';

/** Review navigation; selection and editable import data remain owned by the form. */
export interface ReviewQuery extends ImportCandidatesQuery {
  reviewStage?: 'months' | 'review';
  adjustmentsOpen?: boolean;
  cardPage?: number;
  cardOpen?: boolean;
}
