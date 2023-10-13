import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';

import { BudgetListActions } from '@/app/budget/budget-list-actions';
import { Button } from '@/components/ui/button';
import { cn, formatStringToCurrency } from '@/lib/utils';
import { Transaction } from '@/types/app';

export const budgetColumns: Array<ColumnDef<Transaction>> = [
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
      const isExpense = row.getValue<string>('type').toLowerCase() === 'EXPENSE'.toLowerCase();
      const formattedAmount = formatStringToCurrency(row.getValue<number>('amount'));

      return (
        <div className={cn(isExpense ? 'text-red-500' : 'text-green-500', 'text-right font-medium')}>
          {isExpense ? '-' : '+'}
          {formattedAmount}
        </div>
      );
    },
  },
  {
    accessorKey: 'executedAt',
    header: ({ column }) => {
      return (
        <div className='flex justify-end'>
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Date
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const executionDate = row.getValue<string>('executedAt');
      const formattedDate = format(parseISO(executionDate), 'dd.MM.yy');
      return <div className={cn('text-right font-medium')}>{formattedDate}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <BudgetListActions row={row} />,
  },
];
