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

/** The table state a list query is built from; omitted values mean the first page, no search and the default sort. */
export interface TableState {
  pageIndex?: number;
  search?: string;
  sort?: ColumnSort;
}

/**
 * Builds the list query of a table state. Route loaders call it without a state to prefetch the first page under the
 * same query key as the table.
 */
export function toTableQuery<TSort extends string>(
  { columns, defaultSort }: TableSort<TSort>,
  { pageIndex = 0, search, sort = defaultSort }: TableState = {},
): ListQuery<TSort> {
  return {
    descending: sort.desc,
    page: pageIndex + 1,
    pageSize: tablePageSize,
    search: search || undefined,
    sort: columns[sort.id],
  };
}

/** URL fields shared by the server-side administration tables. */
export const tableSearchSchema = listSearchSchema.extend({
  sort: z.string().max(100).optional().catch(undefined),
  descending: z.boolean().optional().catch(undefined),
});

export interface TableSearch {
  page?: number;
  search?: string;
  sort?: string;
  descending?: boolean;
}

/** A controlled table; routes own its state and navigation. */
export interface TableControlProps {
  state: TableState;
  onStateChange: (state: TableState, options?: { replace?: boolean }) => void;
}

/** Resolves URL values against the table's supported sort columns. */
export function fromTableSearch<TSort extends string>(sort: TableSort<TSort>, search: TableSearch): TableState {
  const column = search.sort && Object.hasOwn(sort.columns, search.sort) ? search.sort : sort.defaultSort.id;
  return {
    pageIndex: (search.page ?? 1) - 1,
    search: search.search ?? '',
    sort: { id: column, desc: search.descending ?? sort.defaultSort.desc },
  };
}

/** Serializes a table state without introducing a second local copy. */
export function toTableSearch(state: TableState): TableSearch {
  return {
    page: (state.pageIndex ?? 0) + 1,
    search: state.search ?? '',
    sort: state.sort?.id,
    descending: state.sort?.desc,
  };
}
