import { importsQueryOptions } from '@kijk/api/imports/options';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { ImportStatusBadge } from '@/app/imports/status-badge';
import { useSpaceId } from '@/shared/hooks/use-active-space';

/** Table of the space's latest imports, each linking to its details. */
export function ImportList() {
  const spaceId = useSpaceId();
  const { data } = useSuspenseQuery(importsQueryOptions(spaceId));

  return (
    <Card>
      <CardContent>
        {data.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No imports yet.</p>
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
              {data.map((job) => (
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
                  <TableCell>
                    {new Date(job.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell>
                    <ImportStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className='text-right'>{job.status === 'Done' ? job.importedCount : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
