import { getRouteApi } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';

import type { Consumption, Resource } from '@/shared/types/app';
import ResourceUnit from '@/app/consumptions/resources-unit.tsx';
import { useGetConsumptionsBy } from '@/app/consumptions/use-get-consumptions-by.ts';
import { DataTable } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/helpers';

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
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Type
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ getValue }) => {
      const type = getValue<Resource>();
      return (
        <Badge className='bg-slate-300'>
          {type.name} - {type.unit}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'value',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Value
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = row.original.resource;

      return (
        <div>
          {row.getValue('value')} {<ResourceUnit type={type} />}
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
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
      );
    },
    cell: ({ row }) => {
      const executionDate = row.getValue<string>('date');
      const formattedDate = format(parseISO(executionDate), 'dd.MM.yy');
      return <div className={cn('text-right font-medium')}>{formattedDate}</div>;
    },
  },
  // TODO: Implement actions
  // {
  //   id: 'actions',
  //   cell: ({ row }) => <BudgetListActions row={row} />,
  //   enableColumnFilter: false,
  //   enableSorting: false,
  //   enableHiding: false,
  //   header: undefined,
  //   size: 0,
  //   maxSize: 0,
  // },
];
