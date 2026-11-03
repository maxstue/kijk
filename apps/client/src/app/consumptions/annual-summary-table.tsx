import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import type { ColumnDef } from '@tanstack/react-table';
import {
  createExpandedRowModel,
  flexRender,
  rowExpandingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { Fragment } from 'react';

import { ResourceIcon } from '@/shared/components/resource-icon';
import { ResourceUnit } from '@/shared/components/resources-unit';

import { AnnualEntriesTable } from './annual-entries-table';
import { type AnnualResourceSummary } from './helpers';
import { LimitWarning } from './limit-warning';

const summaryFeatures = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
});

const summaryColumns: Array<ColumnDef<typeof summaryFeatures, AnnualResourceSummary>> = [
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
              <LimitWarning resourceId={summary.resource.id} />
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

interface AnnualSummaryTableProps {
  summaries: AnnualResourceSummary[];
}

export function AnnualSummaryTable({ summaries }: AnnualSummaryTableProps) {
  'use no memo';

  const table = useTable({
    columns: summaryColumns,
    data: summaries,
    features: summaryFeatures,
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
                  {row.getAllCells().map((cell) => (
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
