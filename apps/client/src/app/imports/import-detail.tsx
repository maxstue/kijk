import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Progress } from '@kijk/ui/components/progress';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { formatImportMonth } from '@/app/imports/helpers';
import { ImportMappingStep } from '@/app/imports/mapping-step';
import { ImportReviewStep } from '@/app/imports/review-step';
import { ImportStatusBadge } from '@/app/imports/status-badge';
import { importQueryOptions, isImportProcessing } from '@/shared/api/imports/options';
import type { ImportJob } from '@/shared/api/imports/types';

/** An import with the step that matches its state. */
export function ImportDetail({ importId }: { importId: string }) {
  const { data: job } = useSuspenseQuery(importQueryOptions(importId));

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='text-2xl font-bold tracking-tight'>{job.fileName}</h2>
        <ImportStatusBadge status={job.status} />
        <span className='text-muted-foreground'>into {job.accountName}</span>
      </div>
      <ImportStep job={job} />
    </div>
  );
}

function ImportStep({ job }: { job: ImportJob }) {
  if (isImportProcessing(job.status)) {
    return <ProcessingCard job={job} />;
  }
  switch (job.status) {
    case 'NeedsMapping':
      return <ImportMappingStep key={job.id} initialMapping={job.proposedMapping} job={job} />;
    case 'NeedsReview':
      return <ImportReviewStep job={job} />;
    case 'Done':
      return <DoneCard job={job} />;
    default:
      return <ClosedCard job={job} />;
  }
}

const processingTitles: Partial<Record<ImportJob['status'], string>> = {
  Categorizing: 'Suggesting categories',
  Reading: 'Reading the file',
};

function ProcessingCard({ job }: { job: ImportJob }) {
  const rowCount = Number(job.rowCount);
  const processed = Number(job.processedRows);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{processingTitles[job.status] ?? 'Detecting the format'}</CardTitle>
        <CardDescription>
          {job.status === 'Categorizing'
            ? 'Cleaned transaction texts are sent to the AI provider. This runs in the background; the rows stay as they are if it fails.'
            : 'This runs in the background; you can leave this page and come back later.'}
        </CardDescription>
      </CardHeader>
      {job.status === 'Reading' && rowCount > 0 && (
        <CardContent className='space-y-2'>
          <Progress value={(processed / rowCount) * 100} />
          <p className='text-muted-foreground text-sm'>
            {processed.toLocaleString()} of {rowCount.toLocaleString()} rows
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function DoneCard({ job }: { job: ImportJob }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{Number(job.importedCount).toLocaleString()} transactions imported</CardTitle>
        <CardDescription>
          Replaced: {job.replacedMonths.map(formatImportMonth).join(', ') || 'no months'}
          {job.skippedMonths.length > 0 && <> · Skipped: {job.skippedMonths.map(formatImportMonth).join(', ')}</>}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex gap-2'>
        <Button asChild>
          <Link to='/finances/transactions'>Show transactions</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link to='/finances/budgets'>Show budgets</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ClosedCard({ job }: { job: ImportJob }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{job.status === 'Cancelled' ? 'Import cancelled' : 'Import failed'}</CardTitle>
        <CardDescription>
          {job.error ?? 'The uploaded file was deleted.'} Upload the file again to start a new import.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant='outline'>
          <Link to='/imports'>Back to imports</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
