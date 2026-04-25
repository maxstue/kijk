import { Button } from '@kijk/ui/components/button';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { ResourceTypeListRowActions } from '@/app/resources/resources-list-row-actions';
import type { Resource } from '@/shared/types/app';

export const resourceDefaultSort: ColumnSort = { desc: false, id: 'name' };

export const resourcesColumns: Array<ColumnDef<Resource>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'unit',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Unit
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'color',
    cell: ({ row }) => {
      const colorValue = row.getValue<string>('color');
      return <div style={{ color: colorValue }}>{colorValue}</div>;
    },
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Color
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'creatorType',
    cell: ({ row }) => {
      const colorValue = row.getValue<string>('creatorType');
      return <div style={{ color: colorValue }}>{colorValue}</div>;
    },
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Creator
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    cell: ({ row }) => <ResourceTypeListRowActions row={row} />,
    id: 'actions',
  },
];
