import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { ResourceTypeRowActions } from '@/app/resources/row-actions';
import type { Resource } from '@/shared/types/domain';

export const resourceDefaultSort: ColumnSort = { desc: false, id: 'name' };

export const getResourceTypeColumns = (canManage: boolean): Array<ColumnDef<Resource>> => [
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
      return (
        <div className='flex items-center gap-2'>
          <span className='size-4 rounded-full border' style={{ backgroundColor: colorValue }} />
          <span>{colorValue}</span>
        </div>
      );
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
      const creatorType = row.getValue<string>('creatorType');
      return (
        <Badge variant={creatorType === 'System' ? 'secondary' : 'outline'}>
          {creatorType === 'System' ? 'System' : 'Custom'}
        </Badge>
      );
    },
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Creator
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    cell: ({ row }) => <ResourceTypeRowActions canManage={canManage} row={row} />,
    id: 'actions',
  },
];
