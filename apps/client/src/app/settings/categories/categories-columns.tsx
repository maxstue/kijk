import { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { DataListRowActions } from '@/app/settings/categories/categories-list-actions';
import { Button } from '@/shared/components/ui/button';
import { Category } from '@/shared/types/app';

export const categoryDefaultSort: ColumnSort = { desc: false, id: 'name' };

export const categoryColumns: Array<ColumnDef<Category>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'color',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Color
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const colorValue = row.getValue<string>('color');
      return <div style={{ color: colorValue }}>{colorValue}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataListRowActions row={row} />,
  },
];
