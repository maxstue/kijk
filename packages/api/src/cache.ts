import { spaceKeyRoot } from '@kijk/api/query-keys';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Marks every query under the given keys as stale and refetches the active ones; resolves when they are loaded. */
export async function invalidate(client: QueryClient, ...queryKeys: QueryKey[]) {
  await Promise.all(queryKeys.map((queryKey) => client.invalidateQueries({ queryKey })));
}

/**
 * Invalidates a feature's queries in every space, e.g. resources after a change to a user's unit that several spaces
 * show. `features` are the key parts after the space id, such as `resources`.
 */
export async function invalidateInEverySpace(client: QueryClient, ...features: string[]) {
  await client.invalidateQueries({
    predicate: ({ queryKey }) => queryKey[0] === spaceKeyRoot && features.includes(queryKey[2] as string),
  });
}
