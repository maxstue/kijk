import * as accountsOptions from '@kijk/api/accounts/options';
import * as importsOptions from '@kijk/api/imports/options';
import type { ImportsQuery } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { ImportStatusBadge } from '@/app/imports/status-badge';
import { ListFilter } from '@/shared/components/list-filter';
import { ListPagination } from '@/shared/components/list-pagination';
import { SearchInput } from '@/shared/components/search-input';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatDateTime } from '@/shared/utils/format';

import { importStatusLabels } from './constants';

interface Props {
  query: ImportsQuery;
  onQueryChange: (query: ImportsQuery) => void;
}

/** Table of the space's latest imports, each linking to its details. */
export function ImportList({ query, onQueryChange }: Props) {
  const spaceId = useSpaceId();
  const { data, isFetching, isPending, isError, refetch } = useQuery(importsOptions.listQueryOptions(spaceId, query));
  const { data: accounts } = useSuspenseQuery(accountsOptions.listQueryOptions(spaceId));
  const update = (change: Partial<ImportsQuery>) => onQueryChange({ ...query, ...change, page: 1 });

  return (
    <Card>
      <CardContent>
        <div className='my-4 flex flex-wrap gap-3'>
          <SearchInput
            value={query.search ?? ''}
            aria-label='Search imports'
            placeholder='Search file or account…'
            onSearch={(search) => update({ search })}
          />
          <ListFilter
            label='Statuses'
            value={query.status}
            options={Object.entries(importStatusLabels).map(([value, label]) => ({ value, label }))}
            onChange={(status) => update({ status: status as ImportsQuery['status'] })}
          />
          <ListFilter
            label='Accounts'
            value={query.accountId}
            options={accounts.items.map((account) => ({ value: account.id, label: account.name }))}
            onChange={(accountId) => update({ accountId })}
          />
          <ListFilter
            label='Sort order'
            allowAll={false}
            value={`${query.sort ?? 'CreatedAt'}:${query.descending ?? true}`}
            options={[
              { value: 'CreatedAt:true', label: 'Newest first' },
              { value: 'CreatedAt:false', label: 'Oldest first' },
              { value: 'FileName:false', label: 'File name' },
              { value: 'Account:false', label: 'Account name' },
            ]}
            onChange={(value) => {
              const [sort, descending] = (value ?? 'CreatedAt:true').split(':');
              update({ sort: sort as ImportsQuery['sort'], descending: descending === 'true' });
            }}
          />
        </div>
        {isPending && <p role='status'>Loading imports…</p>}
        {isError && (
          <div role='alert'>
            Imports could not be loaded.{' '}
            <Button variant='outline' onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}
        {data && (
          <ListPagination
            {...data}
            isFetching={isFetching}
            onPageChange={(page) => onQueryChange({ ...query, page })}
          />
        )}
        {data && (
          <div aria-busy={isFetching}>
            {data.items.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No matching imports.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Imported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Link
                          className='font-medium underline-offset-4 hover:underline'
                          params={{ spaceId: spaceId, importId: job.id }}
                          to='/$spaceId/finances/imports/$importId'
                        >
                          {job.fileName}
                        </Link>
                      </TableCell>
                      <TableCell>{job.accountName}</TableCell>
                      <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                      <TableCell>
                        <ImportStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className='text-right'>{job.status === 'Done' ? job.importedCount : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
