import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Input } from '@kijk/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';

import type { Unit } from '@/shared/api/units/types';

import { UnitRowActions } from './row-actions';

interface Props {
  householdId?: string;
  /** Households in which the user's role allows sharing units. */
  shareableHouseholds: Array<{ id: string; name: string }>;
  isPending: boolean;
  items: Unit[];
  page: number;
  pageSize: number;
  scope: 'household' | 'personal';
  search: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  systemUnits: Unit[];
  totalCount: number;
}

/** Paginated, searchable unit table. */
export function UnitTable({
  householdId,
  shareableHouseholds,
  isPending,
  items,
  page,
  pageSize,
  scope,
  search,
  setPage,
  setSearch,
  systemUnits,
  totalCount,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return (
    <div className='min-w-0'>
      <div className='my-4'>
        <Input
          className='w-full sm:max-w-xs'
          placeholder='Filter name or symbol...'
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
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
            {isPending ? (
              <TableRow>
                <TableCell className='h-24 text-center' colSpan={5}>
                  Loading units...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell className='h-24 text-center' colSpan={5}>
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              items.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <span className='font-medium'>
                      {unit.name} ({unit.symbol})
                    </span>
                    {unit.conversionType === 'None' && (
                      <p className='text-muted-foreground text-xs'>
                        {unit.isOwner
                          ? 'Legacy unit · define its conversion before using it again'
                          : 'Legacy system unit · read-only'}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{unit.conversionType === 'None' ? 'Unknown' : unit.quantityKey}</TableCell>
                  <TableCell>
                    <Badge variant={unit.creatorType === 'System' ? 'secondary' : 'outline'}>
                      {unit.creatorType === 'System' ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>{unit.isArchived ? 'Archived' : 'Active'}</TableCell>
                  <TableCell>
                    <UnitRowActions
                      householdId={householdId}
                      shareableHouseholds={shareableHouseholds}
                      scope={scope}
                      systemUnits={systemUnits}
                      unit={unit}
                    />
                  </TableCell>
                </TableRow>
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
