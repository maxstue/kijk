'use no memo';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, Columns3Icon, EllipsisVerticalIcon } from 'lucide-react';
import * as React from 'react';

import dataFile from '@/app/home/data.json';

interface DataFile {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
}

const columns: Array<ColumnDef<DataFile>> = [
  {
    cell: ({ row }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          aria-label='Select row'
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          aria-label='Select all'
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && undefined)}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        />
      </div>
    ),
    id: 'select',
  },
  {
    accessorKey: 'type',
    cell: ({ row }) => (
      <div className='w-32'>
        <Badge className='text-muted-foreground px-1.5' variant='outline'>
          {row.original.type}
        </Badge>
      </div>
    ),
    header: 'Resource',
  },
  {
    accessorKey: 'limit',
    cell: ({ row }) => (
      <div className='flex w-full justify-end'>
        <span className='text-muted-foreground'>{row.original.limit}</span>
      </div>
    ),
    header: () => <div className='w-full text-right'>Limit</div>,
  },
  {
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='data-[state=open]:bg-muted text-muted-foreground flex size-8' size='icon' variant='ghost'>
            <EllipsisVerticalIcon />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-32'>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive'>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    id: 'actions',
  },
];

export function HomeTable() {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    columns,
    data: dataFile,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      rowSelection,
      sorting,
    },
  });

  return (
    <Tabs className='w-full flex-col justify-start gap-6' defaultValue='outline'>
      <div className='flex items-center justify-between'>
        <Label className='sr-only' htmlFor='view-selector'>
          View
        </Label>
        <Select defaultValue='outline'>
          <SelectTrigger className='flex w-fit @4xl/main:hidden' id='view-selector' size='sm'>
            <SelectValue placeholder='Select a view' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='outline'>Outline</SelectItem>
            <SelectItem value='past-performance'>Past Performance</SelectItem>
            <SelectItem value='key-personnel'>Key Personnel</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className='**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex'>
          <TabsTrigger value='outline'>Outline</TabsTrigger>
          <TabsTrigger value='past-performance'>
            Past Performance <Badge variant='secondary'>3</Badge>
          </TabsTrigger>
        </TabsList>
        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <Columns3Icon />
                <span className='hidden lg:inline'>Customize Columns</span>
                <span className='lg:hidden'>Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {table
                .getAllColumns()
                .filter((column) => column.accessorFn !== undefined && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    className='capitalize'
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Content */}
      <TabsContent className='relative flex flex-col gap-4 overflow-auto' value='outline'>
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted sticky top-0 z-10'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className='**:data-[slot=table-cell]:first:w-8'>
              {table.getRowModel().rows.length > 0 ? (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className='relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80'
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
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
        <div className='flex items-center justify-between px-4'>
          <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
            selected.
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label className='text-sm font-medium' htmlFor='rows-per-page'>
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className='w-20' id='rows-per-page' size='sm'>
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side='top'>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex w-fit items-center justify-center text-sm font-medium'>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                className='hidden h-8 w-8 p-0 lg:flex'
                disabled={!table.getCanPreviousPage()}
                variant='outline'
                onClick={() => table.setPageIndex(0)}
              >
                <span className='sr-only'>Go to first page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                className='size-8'
                disabled={!table.getCanPreviousPage()}
                size='icon'
                variant='outline'
                onClick={() => table.previousPage()}
              >
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                className='size-8'
                disabled={!table.getCanNextPage()}
                size='icon'
                variant='outline'
                onClick={() => table.nextPage()}
              >
                <span className='sr-only'>Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                className='hidden size-8 lg:flex'
                disabled={!table.getCanNextPage()}
                size='icon'
                variant='outline'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              >
                <span className='sr-only'>Go to last page</span>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent className='flex flex-col px-4 lg:px-6' value='past-performance'>
        <div className='text-muted-foreground aspect-video w-full flex-1 rounded-lg border border-dashed'>
          Coming soon ...
        </div>
      </TabsContent>
    </Tabs>
  );
}
