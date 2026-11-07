import type { Unit } from '@kijk/api/units/types';
import { Button } from '@kijk/ui/components/button';
import { Input } from '@kijk/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import type { ReactNode } from 'react';

import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';

import { UnitTableRow } from './table-row';

interface Props {
  actions?: ReactNode;
  spaceId?: string;
  /** Spaces in which the user's role allows sharing units. */
  shareableSpaces: Array<{ id: string; name: string }>;
  isPending: boolean;
  items: Unit[];
  page: number;
  pageSize: number;
  scope: 'space' | 'personal';
  search: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  totalCount: number;
}

/** Paginated, searchable unit table. */
export function UnitTable({
  actions,
  spaceId,
  shareableSpaces,
  isPending,
  items,
  page,
  pageSize,
  scope,
  search,
  setPage,
  setSearch,
  totalCount,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const statusMessage = getStatusMessage(isPending, items.length);
  return (
    <div className='min-w-0'>
      <div className='my-4'>
        <PageToolbar>
          <PageToolbarControls>
            <Input
              className='w-full sm:w-72'
              placeholder='Filter name or symbol...'
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </PageToolbarControls>
          {actions && <PageToolbarActions>{actions}</PageToolbarActions>}
        </PageToolbar>
      </div>
      <div className='w-full overflow-x-auto rounded border'>
        <Table className='min-w-[600px]'>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {statusMessage ? (
              <TableRow>
                <TableCell className='h-24 text-center' colSpan={5}>
                  {statusMessage}
                </TableCell>
              </TableRow>
            ) : (
              items.map((unit) => (
                <UnitTableRow
                  key={unit.id}
                  unit={unit}
                  spaceId={spaceId}
                  scope={scope}
                  shareableSpaces={shareableSpaces}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-2 py-4 text-sm'>
        <span className='text-muted-foreground'>
          Page {page} of {totalPages} · {totalCount} units
        </span>
        <div className='flex gap-2'>
          <Button disabled={page <= 1 || isPending} size='sm' variant='outline' onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            disabled={page >= totalPages || isPending}
            size='sm'
            variant='outline'
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Returns the message shown instead of rows while loading or when there are no units. */
function getStatusMessage(isPending: boolean, itemCount: number) {
  if (isPending) {
    return 'Loading units...';
  }
  if (itemCount === 0) {
    return 'No results.';
  }
  return undefined;
}
