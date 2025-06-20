import { ArrowUpDown } from 'lucide-react';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';

import type { Resource } from '@/shared/types/app';
import { ResourceTypeListRowActions } from '@/app/resources/resources-list-row-actions';
import { Button } from '@/shared/components/ui/button';

export const resourceDefaultSort: ColumnSort = { desc: false, id: 'name' };

export const resourcesColumns: Array<ColumnDef<Resource>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Unit
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'color',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
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
    accessorKey: 'creator',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Creator
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const colorValue = row.getValue<string>('creator');
      return <div style={{ color: colorValue }}>{colorValue}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ResourceTypeListRowActions row={row} />,
  },
];
