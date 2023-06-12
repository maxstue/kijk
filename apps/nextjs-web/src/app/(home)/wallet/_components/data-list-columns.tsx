'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { DataListRowActions } from '@/app/(home)/wallet/_components/data-list-row-actions';
import { cn } from '@/lib/classnames';
import { formatStringToCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/app';

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className='flex justify-end'>
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Amount
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const isExpense = row.getValue('type') === 'EXPENSE';
      const formattedAmount = formatStringToCurrency(row.getValue('amount'));
      return (
        <div className={cn(isExpense ? 'text-red-500' : 'text-green-500', 'text-right font-medium')}>
          {isExpense ? '-' : '+'}
          {formattedAmount}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataListRowActions row={row} />,
  },
];
