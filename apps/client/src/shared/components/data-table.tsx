'use no memo';

// 'use no memo' until the react compiler/table bug is fixed https://github.com/TanStack/table/issues/5567
import type { ListQuery } from '@kijk/api/paging';
import { Button } from '@kijk/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { flexRender, useTable } from '@tanstack/react-table';
import type { ColumnDef, RowData, SortingState } from '@tanstack/react-table';
import { cn } from 'cn';
import type { ReactNode } from 'react';

import { ListPagination } from '@/shared/components/list-pagination';
import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { SearchInput } from '@/shared/components/search-input';
import { dataTableFeatures } from '@/shared/lib/table-features';
import type { DataTableFeatures } from '@/shared/lib/table-features';
import { toColumnSort, toTableQuery } from '@/shared/lib/table-query';
import type { TableSort, TableControlProps } from '@/shared/lib/table-query';

/** Rows while the first page loads; stable, so the table does not rebuild its row model every render. */
const noRows: never[] = [];

/** The part of an API list page the table reads. */
interface TablePage<TData> {
  items: TData[];
  page: number | string;
  pageSize: number | string;
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
 * next one loads. Paging starts from the page the API served, which can be lower than the requested one after rows were
 * deleted.
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
  search,
  onSearchChange,
}: Props<TData, TSort, TPage, TKey>) {
  const sorting: SortingState = [toColumnSort(sort, search)];
  const { data, isError, isFetching, isPending, isPlaceholderData, refetch } = useQuery(
    queryOptions(toTableQuery(sort, search)),
  );
  const table = useTable({
    columns,
    data: data?.items ?? noRows,
    features: dataTableFeatures,
    manualSorting: true,
    onSortingChange: (updater) => {
      const [next] = typeof updater === 'function' ? updater(sorting) : updater;
      // The initial sort stays out of the URL, also on pages whose tabs share one table state.
      const isDefault = !next || (next.id === sort.defaultSort.id && next.desc === sort.defaultSort.desc);
      onSearchChange({ page: 1, sort: isDefault ? undefined : next.id, descending: isDefault ? undefined : next.desc });
    },
    state: { sorting },
  });

  return (
    <div>
      <div className='my-4'>
        <PageToolbar>
          <PageToolbarControls>
            <SearchInput
              value={search.search ?? ''}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              onSearch={(nextSearch) => onSearchChange({ page: 1, search: nextSearch }, { replace: true })}
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
      {data && (
        <ListPagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          isFetching={isFetching}
          onPageChange={(page) => onSearchChange({ page })}
        />
      )}
    </div>
  );
}
