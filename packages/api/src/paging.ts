import type { PlaceholderDataFunction } from '@tanstack/react-query';

/**
 * Optional search, sort and page of a list endpoint. Without `page` and `pageSize` the API returns every matching row
 * (e.g. for selects); tables send both. The API clamps a page past the end to the last page, and `sort` falls back to
 * the list's default order.
 */
export interface ListQuery<TSort extends string> {
  descending?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: TSort;
}

/**
 * Placeholder of a list query that keeps the previous page visible while a new search, sort or page loads; it never
 * shows another space's rows.
 */
export function keepPreviousPageInSpace<TData>(spaceId: string): PlaceholderDataFunction<TData, Error, TData> {
  return (previousData, previousQuery) => (previousQuery?.queryKey[1] === spaceId ? previousData : undefined);
}
