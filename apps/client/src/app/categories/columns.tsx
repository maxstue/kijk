import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { CategoryRowActions } from '@/app/categories/row-actions';
import type { Category } from '@/shared/api/categories/types';
import { ResourceIcon } from '@/shared/components/resource-icon';
import type { DataTableFeatures } from '@/shared/lib/table-features';

/** Default sorting of the category table (by name). */
export const categoryDefaultSort: ColumnSort = { desc: false, id: 'name' };

/** Columns of the category table; `canConfigure` enables the management actions. */
export const getCategoryColumns = (canConfigure: boolean): Array<ColumnDef<DataTableFeatures, Category>> => [
  {
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <ResourceIcon className='size-4' color={row.original.color} name={row.original.icon} />
        <span>{row.original.name}</span>
      </div>
    ),
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'kind',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Kind
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'creatorType',
    cell: ({ row }) => {
      const isSystem = row.original.creatorType === 'System';
      return <Badge variant={isSystem ? 'secondary' : 'outline'}>{isSystem ? 'Default' : 'Custom'}</Badge>;
    },
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Creator
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    cell: ({ row }) => <CategoryRowActions canConfigure={canConfigure} row={row} />,
    id: 'actions',
  },
];
