// 'use no memo' until the react compiler/table bug is fixed https://github.com/TanStack/table/issues/5567
'use no memo';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { ColumnDef, ColumnFiltersState, ColumnSort, SortingState } from '@tanstack/react-table';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/helpers';

interface Props<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>;
  data: Array<TData>;
  actions?: ReactNode;
  defaultSort?: ColumnSort;
}

export function DataTable<TData, TValue>({ columns, data, actions, defaultSort }: Props<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSort ? [defaultSort] : []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className='my-4 flex items-center justify-between'>
        <Input
          className='w-1/2'
          placeholder='Filter name...'
          value={table.getColumn('name')?.getFilterValue() as string}
          onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
        />
        {actions}
      </div>
      <div className='h-full overflow-scroll rounded border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={cn(header.id === 'actions' && 'w-4')}>
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='px-8'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className='h-24 text-center' colSpan={columns.length}>
                  No results.
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
