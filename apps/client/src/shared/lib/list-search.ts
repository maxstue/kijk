import { z } from 'zod';

/** The longest search text the URL keeps, matching the API; the search field accepts no more. */
export const maxSearchLength = 200;

/** URL state shared by paged lists. */
export const listSearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(2147483647).catch(1).default(1),
  search: z.string().trim().max(maxSearchLength).catch('').default(''),
});
