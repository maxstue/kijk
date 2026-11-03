import { Badge } from '@kijk/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, tableFeatures, useTable } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { RefreshCcw } from 'lucide-react';

import { ResourceUnit } from '@/shared/components/resources-unit';
import type { Consumption } from '@/shared/types/domain';

import { ConsumptionDeleteButton } from './delete-button';
import { ConsumptionEditButton } from './edit-button';

const entryFeatures = tableFeatures({});

const entryColumns: Array<ColumnDef<typeof entryFeatures, Consumption>> = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => format(parseISO(row.original.date), 'dd.MM.yyyy'),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span>{row.original.name}</span>
        {row.original.startsNewMeterSegment && (
          <Badge variant='secondary' className='border-0'>
            <RefreshCcw className='mr-1 size-3' /> Reset
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: 'value',
    header: () => <div className='text-right'>Entered value</div>,
    cell: ({ row }) => (
      <div className='flex items-center justify-end gap-1 tabular-nums'>
        {Number(row.original.value).toLocaleString()} <ResourceUnit type={row.original.resource} />
      </div>
    ),
  },
  {
    id: 'consumption',
    header: () => <div className='text-right'>Consumption</div>,
    cell: ({ row }) => (
      <div className='text-right tabular-nums'>
        {row.original.startsNewMeterSegment ? (
          '—'
        ) : (
          <span className='flex items-center justify-end gap-1'>
            {Number(row.original.calculatedConsumption).toLocaleString()} <ResourceUnit type={row.original.resource} />
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className='flex justify-end gap-1'>
        <ConsumptionEditButton id={row.original.id} />
        <ConsumptionDeleteButton id={row.original.id} date={row.original.date} />
      </div>
    ),
  },
];

interface AnnualEntriesTableProps {
  entries: Consumption[];
}

export function AnnualEntriesTable({ entries }: AnnualEntriesTableProps) {
  'use no memo';

  const table = useTable({
    columns: entryColumns,
    data: entries,
    features: entryFeatures,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className={row.original.startsNewMeterSegment ? 'bg-primary/5' : undefined}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
