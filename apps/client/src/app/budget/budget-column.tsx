import { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';

import { BudgetListActions } from '@/app/budget/budget-list-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatStringToCurrency } from '@/lib/utils';
import { Category, Transaction } from '@/types/app';

export const budgetDefaultSort: ColumnSort = { desc: true, id: 'executedAt' };

export const budgetColumns: Array<ColumnDef<Transaction>> = [
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
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Category
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ getValue }) => {
      const category = getValue<Category | undefined>();
      return category ? (
        <Badge style={{ backgroundColor: category.color }}>{category.name}</Badge>
      ) : (
        <span className='text-muted-foreground'>-</span>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Amount
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isExpense = row.original.type.toLowerCase() === 'EXPENSE'.toLowerCase();
      const formattedAmount = formatStringToCurrency(row.getValue<number>('amount'));

      return (
        <div className={cn(isExpense ? 'text-red-500' : 'text-green-500', 'font-medium')}>
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
    enableColumnFilter: false,
    enableSorting: false,
    enableHiding: false,
    header: undefined,
    size: 0,
    maxSize: 0,
  },
];
