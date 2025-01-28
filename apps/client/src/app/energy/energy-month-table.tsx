import { useMemo } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';

import EnergyUnit from '@/app/energy/energy-unit';
import { useGetEnergiesBy } from '@/app/energy/use-get-energy-by';
import { DataTable } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/helpers';
import { Energy, EnergyType } from '@/shared/types/app';

const Route = getRouteApi('/_protected/energy');

export function EnergyMonthTable() {
  const searchParameters = Route.useSearch();

  const { data } = useGetEnergiesBy(searchParameters.year, searchParameters.month);
  const energy = useMemo(() => data ?? [], [data]);

  return <DataTable columns={columns} data={energy} defaultSort={defaultSort} />;
}

const defaultSort: ColumnSort = { desc: true, id: 'date' };

const columns: Array<ColumnDef<Energy>> = [
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
      const type = getValue<EnergyType>();
      if (type === 'Electricity') {
        return <Badge className='bg-yellow-300'>{type}</Badge>;
      }
      if (type === 'Water') {
        return <Badge className='bg-blue-400'>{type}</Badge>;
      }

      return <Badge className='bg-slate-300'>{type}</Badge>;
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
      const type = row.original.type;

      return (
        <div>
          {row.getValue('value')} {<EnergyUnit type={type} />}
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
