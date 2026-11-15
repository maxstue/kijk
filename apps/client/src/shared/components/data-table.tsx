'use no memo';

// 'use no memo' until the react compiler/table bug is fixed https://github.com/TanStack/table/issues/5567
import type { ListQuery } from '@kijk/api/paging';
import { Button } from '@kijk/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { flexRender, useTable } from '@tanstack/react-table';
import type { ColumnDef, PaginationState, RowData, SortingState } from '@tanstack/react-table';
import { cn } from 'cn';
import { useEffect, useEffectEvent } from 'react';
import type { ReactNode } from 'react';

import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { SearchInput } from '@/shared/components/search-input';
import { dataTableFeatures } from '@/shared/lib/table-features';
import type { DataTableFeatures } from '@/shared/lib/table-features';
import { tablePageSize, toTableQuery } from '@/shared/lib/table-query';
import type { TableSort, TableControlProps } from '@/shared/lib/table-query';

/** Rows while the first page loads; stable, so the table does not rebuild its row model every render. */
const noRows: never[] = [];

/** The part of an API list page the table reads. */
interface TablePage<TData> {
  items: TData[];
  page: number | string;
  totalCount: number | string;
}

interface Props<
  TData extends RowData,
  TSort extends string,
  TPage extends TablePage<TData>,
  TKey extends QueryKey,
> extends TableControlProps {
  columns: Array<ColumnDef<DataTableFeatures, TData>>;
  actions?: ReactNode;
  searchPlaceholder?: string;
  /** Builds the list query of one page; the API searches, sorts and pages the rows. */
  queryOptions: (query: ListQuery<TSort>) => UseQueryOptions<TPage, Error, TPage, TKey>;
  sort: TableSort<TSort>;
}

/**
 * Server-side table with a search, sortable columns and pagination (10 rows per page): search, sort and page go to the
 * list endpoint together. A new search or sort starts at the first page again; the shown page stays visible while the
 * next one loads.
 */
export function DataTable<
  TData extends RowData,
  TSort extends string,
  TPage extends TablePage<TData>,
  TKey extends QueryKey,
>({
  columns,
  actions,
  searchPlaceholder = 'Search...',
  queryOptions,
  sort,
  state,
  onStateChange,
}: Props<TData, TSort, TPage, TKey>) {
  const { search = '', pageIndex = 0 } = state;
  const sorting: SortingState = [state.sort ?? sort.defaultSort];
  const { data, isError, isPending, isPlaceholderData, refetch } = useQuery(
    queryOptions(toTableQuery(sort, { pageIndex, search, sort: sorting[0] })),
  );
  // The API returns the last page when the requested one no longer exists, for example after deleting its last row.
  const servedPageIndex = data && !isPlaceholderData ? Number(data.page) - 1 : pageIndex;
  // A background invalidation can clamp the page after deletion. Update the external URL only when that page changes,
  // reading the latest navigation callback and other filters without resynchronizing on their object identities.
  const syncServedPage = useEffectEvent((pageIndex: number) => {
    onStateChange({ ...state, pageIndex }, { replace: true });
  });
  useEffect(() => {
    if (servedPageIndex !== pageIndex) {
      syncServedPage(servedPageIndex);
    }
  }, [servedPageIndex, pageIndex]);

  const pagination: PaginationState = { pageIndex, pageSize: tablePageSize };
  const table = useTable({
    columns,
    data: data?.items ?? noRows,
    features: dataTableFeatures,
    manualPagination: true,
    manualSorting: true,
    rowCount: Number(data?.totalCount ?? 0),
    onPaginationChange: (updater) =>
      onStateChange({ ...state, pageIndex: (typeof updater === 'function' ? updater(pagination) : updater).pageIndex }),
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onStateChange({ ...state, sort: next[0] ?? sort.defaultSort, pageIndex: 0 });
    },
    state: {
      pagination,
      sorting,
    },
  });

  return (
    <div>
      <div className='my-4'>
        <PageToolbar>
          <PageToolbarControls>
            <SearchInput
              value={search}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              onSearch={(nextSearch) => {
                onStateChange({ ...state, search: nextSearch, pageIndex: 0 }, { replace: true });
              }}
            />
          </PageToolbarControls>
          {actions && <PageToolbarActions>{actions}</PageToolbarActions>}
        </PageToolbar>
      </div>
      {isError && (
        <div role='alert' className='mb-3 flex items-center gap-3'>
          <span>The rows could not be loaded.</span>
          <Button size='sm' variant='outline' onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}
      <div
        aria-busy={isPlaceholderData}
        className={cn('h-full overflow-scroll rounded border transition-opacity', isPlaceholderData && 'opacity-60')}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={cn(header.id === 'actions' && 'w-4')}>
                    {header.isPlaceholder ? undefined : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className='px-8'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className='h-24 text-center' colSpan={columns.length}>
                  {isPending && 'Loading...'}
                  {!isPending && !isError && 'No results.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <Button
          disabled={!table.getCanPreviousPage()}
          size='sm'
          variant='outline'
          onClick={() => {
            table.previousPage();
          }}
        >
          Previous
        </Button>
        <Button
          disabled={!table.getCanNextPage()}
          size='sm'
          variant='outline'
          onClick={() => {
            table.nextPage();
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
