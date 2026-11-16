import type { ListQuery } from '@kijk/api/paging';
import type { ColumnSort } from '@tanstack/react-table';
import { z } from 'zod';

import { listSearchSchema } from './list-search';

/** Rows per page of a `DataTable`. */
export const tablePageSize = 10;

/** The sortable columns of a server-side table and its initial sort. */
export interface TableSort<TSort extends string> {
  /** Maps the ids of the sortable columns to the sort values of the API. */
  columns: Partial<Record<string, TSort>>;
  defaultSort: ColumnSort;
}

/** URL state of a server-side table: page, search and the sorted column. */
export const tableSearchSchema = listSearchSchema.extend({
  sort: z.string().max(100).optional().catch(undefined),
  descending: z.boolean().optional().catch(undefined),
});

/** URL state of a server-side table; routes pass it to `DataTable` unchanged. */
export type TableSearch = z.infer<typeof tableSearchSchema>;

/** A table controlled through its route's URL state. */
export interface TableControlProps {
  search: Partial<TableSearch>;
  onSearchChange: (change: Partial<TableSearch>, options?: { replace?: boolean }) => void;
}

/** The sorted column of the URL state; unsupported columns fall back to the table's initial sort. */
export function toColumnSort<TSort extends string>(
  { columns, defaultSort }: TableSort<TSort>,
  { sort, descending }: Partial<TableSearch>,
): ColumnSort {
  return sort && Object.hasOwn(columns, sort)
    ? { id: sort, desc: descending ?? defaultSort.desc }
    : { id: defaultSort.id, desc: descending ?? defaultSort.desc };
}

/**
 * Builds the list query of the URL state. Route loaders call it with their search params to prefetch the same page
 * under the same query key as the table.
 */
export function toTableQuery<TSort extends string>(
  sort: TableSort<TSort>,
  search: Partial<TableSearch> = {},
): ListQuery<TSort> {
  const column = toColumnSort(sort, search);
  return {
    descending: column.desc,
    page: search.page ?? 1,
    pageSize: tablePageSize,
    search: search.search || undefined,
    sort: sort.columns[column.id],
  };
}

/** URL values a table starts with; `stripSearchParams` leaves them out of the URL. */
export function tableSearchDefaults({ defaultSort }: TableSort<string>): Required<TableSearch> {
  return { page: 1, search: '', sort: defaultSort.id, descending: defaultSort.desc };
}
