import { cn } from '@kijk/core/utils/style';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { getRouteApi } from '@tanstack/react-router';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';

import { ResourceUnit } from '@/app/consumptions/resources-unit.tsx';
import { useGetConsumptionsBy } from '@/app/consumptions/use-get-consumptions-by.ts';
import { DataTable } from '@/shared/components/data-table';
import type { Consumption, Resource } from '@/shared/types/app';

const Route = getRouteApi('/_protected/consumptions');

export function ConsumptionsMonthTable() {
  const { month, year } = Route.useSearch();

  const { data } = useGetConsumptionsBy(year, month);

  return <DataTable columns={columns} data={data} defaultSort={defaultSort} />;
}

const defaultSort: ColumnSort = { desc: true, id: 'date' };

const columns: Array<ColumnDef<Consumption>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => {
          column.toggleSorting(column.getIsSorted() === 'asc');
        }}
      >
        Name
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'type',
    cell: ({ getValue }) => {
      const type = getValue<Resource>();
      return (
        <Badge className='bg-slate-300'>
          {type.name} - {type.unit}
        </Badge>
      );
    },
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => {
          column.toggleSorting(column.getIsSorted() === 'asc');
        }}
      >
        Type
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'value',
    cell: ({ row }) => {
      const type = row.original.resource;

      return (
        <div>
          {row.getValue('value')} <ResourceUnit type={type} />
        </div>
      );
    },
    header: ({ column }) => (
      <Button
        variant='ghost'
        onClick={() => {
          column.toggleSorting(column.getIsSorted() === 'asc');
        }}
      >
        Value
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'date',
    cell: ({ row }) => {
      const executionDate = row.getValue<string>('date');
      const formattedDate = format(parseISO(executionDate), 'dd.MM.yy');
      return <div className={cn('text-right font-medium')}>{formattedDate}</div>;
    },
    header: ({ column }) => (
      <div className='flex justify-end'>
        <Button
          variant='ghost'
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      </div>
    ),
  },
  // TODO: Implement actions
  // {
  //   Id: 'actions',
  //   Cell: ({ row }) => <BudgetListActions row={row} />,
  //   EnableColumnFilter: false,
  //   EnableSorting: false,
  //   EnableHiding: false,
  //   Header: undefined,
  //   Size: 0,
  //   MaxSize: 0,
  // },
];
