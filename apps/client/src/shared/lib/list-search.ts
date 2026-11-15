import { z } from 'zod';

/** URL state shared by paged lists. */
export const listSearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(2147483647).catch(1).default(1),
  search: z.string().trim().max(200).catch('').default(''),
});
