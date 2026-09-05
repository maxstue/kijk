import { Badge } from '@kijk/ui/components/badge';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';

import { ConsumptionDeleteButton } from '@/app/consumptions/delete-button';
import { ConsumptionEditButton } from '@/app/consumptions/edit-button';
import { ConsumptionLimitWarning } from '@/app/consumptions/limit-warning';
import { allResourceTypes, ConsumptionTypeFilter } from '@/app/consumptions/type-filter';
import { DataTable } from '@/shared/components/data-table';
import { ResourceUnit } from '@/shared/components/resources-unit';
import type { Consumption } from '@/shared/types/domain';

const defaultSort: ColumnSort = { desc: true, id: 'date' };

const columns: Array<ColumnDef<Consumption>> = [
  {
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span>{row.original.name}</span>
        <ConsumptionLimitWarning resourceId={row.original.resource.id} />
      </div>
    ),
    header: 'Name',
  },
  {
    accessorFn: (consumption) => consumption.resource.name,
    id: 'resource',
    cell: ({ row }) => <Badge variant='secondary'>{row.original.resource.name}</Badge>,
    header: 'Type',
  },
  {
    accessorKey: 'value',
    cell: ({ row }) => (
      <span>
        {row.original.value} <ResourceUnit type={row.original.resource} />
      </span>
    ),
    header: 'Value',
  },
  {
    accessorKey: 'date',
    cell: ({ row }) => format(parseISO(row.original.date), 'dd.MM.yyyy'),
    header: 'Date',
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className='flex justify-end gap-2'>
        <ConsumptionEditButton data={row.original} />
        <ConsumptionDeleteButton id={row.original.id} date={row.original.date} />
      </div>
    ),
    enableColumnFilter: false,
    enableHiding: false,
    enableSorting: false,
    header: undefined,
  },
];

interface Props {
  consumptions: Consumption[];
}

export function ConsumptionAnnualView({ consumptions }: Props) {
  const [selectedResource, setSelectedResource] = useState(allResourceTypes);
  const resources = useMemo(
    () =>
      [...new Map(consumptions.map((consumption) => [consumption.resource.id, consumption.resource])).values()].sort(
        (left, right) => left.name.localeCompare(right.name),
      ),
    [consumptions],
  );
  const filteredConsumptions = useMemo(
    () =>
      selectedResource === allResourceTypes
        ? consumptions
        : consumptions.filter((consumption) => consumption.resource.id === selectedResource),
    [consumptions, selectedResource],
  );
  return (
    <div className='space-y-2'>
      <ConsumptionTypeFilter resources={resources} value={selectedResource} onSelect={setSelectedResource} />
      <DataTable columns={columns} data={filteredConsumptions} defaultSort={defaultSort} />
    </div>
  );
}
