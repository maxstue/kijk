import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Marks every query under the given keys as stale and refetches the active ones; resolves when they are loaded. */
export async function invalidate(client: QueryClient, ...queryKeys: QueryKey[]) {
  await Promise.all(queryKeys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
