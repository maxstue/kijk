import { Badge } from '@kijk/ui/components/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ChevronDown, RefreshCcw } from 'lucide-react';
import { Fragment, useState } from 'react';

import { ResourceIcon } from '@/shared/components/resource-icon';
import { ResourceUnit } from '@/shared/components/resources-unit';
import type { Consumption } from '@/shared/types/domain';

import { ConsumptionDeleteButton } from './delete-button';
import { ConsumptionEditButton } from './edit-button';
import { createAnnualResourceSummaries, type AnnualResourceSummary } from './helpers';
import { ConsumptionLimitWarning } from './limit-warning';
import { allResourceTypes, ConsumptionTypeFilter } from './type-filter';

interface AnnualViewProps {
  consumptions: Consumption[];
}

const summaryColumns: Array<ColumnDef<AnnualResourceSummary>> = [
  {
    id: 'expand',
    header: '',
    cell: ({ row }) => (
      <button
        type='button'
        className='text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md'
        aria-label={row.getIsExpanded() ? 'Collapse entries' : 'Expand entries'}
        aria-expanded={row.getIsExpanded()}
        onClick={row.getToggleExpandedHandler()}
      >
        <ChevronDown className={`size-4 transition-transform ${row.getIsExpanded() ? 'rotate-180' : ''}`} />
      </button>
    ),
  },
  {
    id: 'resource',
    header: 'Resource',
    cell: ({ row }) => {
      const summary = row.original;
      return (
        <div className='flex min-w-0 items-center gap-3'>
          <ResourceIcon name={summary.resource.icon} color={summary.resource.color} className='size-5 shrink-0' />
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <span className='truncate font-medium'>{summary.resource.name}</span>
              <ConsumptionLimitWarning resourceId={summary.resource.id} />
            </div>
            <span className='text-muted-foreground text-xs'>
              {summary.entryCount} {summary.entryCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: 'total',
    header: () => <div className='text-right'>Total</div>,
    cell: ({ row }) => (
      <div className='text-right'>
        <div className='flex items-center justify-end gap-1 font-medium tabular-nums'>
          {row.original.totalValue.toLocaleString()} <ResourceUnit type={row.original.resource} />
        </div>
        <div className='text-muted-foreground text-xs'>Total consumption</div>
      </div>
    ),
  },
];

const entryColumns: Array<ColumnDef<Consumption>> = [
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

function AnnualEntriesTable({ entries }: { entries: Consumption[] }) {
  'use no memo';

  const table = useReactTable({
    columns: entryColumns,
    data: entries,
    getCoreRowModel: getCoreRowModel(),
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
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AnnualSummaryTable({ summaries }: { summaries: AnnualResourceSummary[] }) {
  'use no memo';

  const table = useReactTable({
    columns: summaryColumns,
    data: summaries,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.resource.id,
  });

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={header.column.id === 'expand' ? 'w-12' : undefined}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={summaryColumns.length} className='text-muted-foreground h-24 text-center'>
                No consumptions found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow key={`${row.id}-entries`}>
                    <TableCell colSpan={summaryColumns.length} className='bg-muted/20 p-0'>
                      <AnnualEntriesTable entries={row.original.entries} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ConsumptionAnnualView({ consumptions }: AnnualViewProps) {
  const [resourceId, setResourceId] = useState(allResourceTypes);
  const summaries = createAnnualResourceSummaries(consumptions);
  const resources = summaries.map((summary) => summary.resource);
  const filteredSummaries =
    resourceId === allResourceTypes ? summaries : summaries.filter((summary) => summary.resource.id === resourceId);

  return (
    <div className='space-y-4'>
      <ConsumptionTypeFilter resources={resources} value={resourceId} onSelect={setResourceId} />
      <AnnualSummaryTable summaries={filteredSummaries} />
    </div>
  );
}
