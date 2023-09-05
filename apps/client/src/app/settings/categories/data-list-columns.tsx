import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { DataListRowActions } from '@/app/settings/categories/data-list-row-actions';
import { Button } from '@/components/ui/button';
import { Category } from '@/types/app';

export const columns: Array<ColumnDef<Category>> = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'color',
    header: ({ column }) => {
      return (
        <div className='flex justify-end'>
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Color
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        </div>
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
