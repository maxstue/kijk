import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Progress } from '@kijk/ui/components/progress';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { formatImportMonth } from '@/app/imports/helpers';
import { ImportMappingStep } from '@/app/imports/mapping-step';
import { ImportReviewStep } from '@/app/imports/review-step';
import { ImportStatusBadge } from '@/app/imports/status-badge';
import { ImportWizard } from '@/app/imports/wizard';
import { importQueryOptions, isImportProcessing } from '@/shared/api/imports/options';
import type { ImportJob } from '@/shared/api/imports/types';

const stepTitles: Record<ImportJob['status'], string> = {
  Pending: 'Preparing your file',
  Analyzing: 'Detecting the columns',
  NeedsMapping: 'Check your columns',
  Reading: 'Preparing your transactions',
  NeedsReview: 'Review and save your import',
  Categorizing: 'Suggesting categories',
  Done: 'Import complete',
  Cancelled: 'Import cancelled',
  Failed: 'Import failed',
};

/** An import with the step that matches its state. */
export function ImportDetail({ importId }: { importId: string }) {
  const { data: job } = useSuspenseQuery(importQueryOptions(importId));

  const [reviewStage, setReviewStage] = useState<'months' | 'review'>('months');
  const isReview = job.status === 'NeedsReview' || job.status === 'Categorizing';

  return (
    <ImportWizard
      {...getStepPresentation(job.status, reviewStage)}
      context={
        <>
          <span className='font-medium'>{job.accountName}</span>
          <span className='text-muted-foreground min-w-0 flex-1 break-all'>{job.fileName}</span>
          <ImportStatusBadge status={job.status} />
        </>
      }
    >
      {isReview ? (
        <ImportReviewStep key={job.id} job={job} stage={reviewStage} onStageChange={setReviewStage} />
      ) : (
        <ImportStep job={job} />
      )}
    </ImportWizard>
  );
}

function getStepPresentation(status: ImportJob['status'], stage: 'months' | 'review') {
  switch (status) {
    case 'NeedsReview':
    case 'Categorizing':
      return stage === 'months'
        ? {
            title: 'Which months do you want to import?',
            description: 'Confirm that your bank export covers each selected month in full.',
            currentStep: 2,
          }
        : {
            title: 'Check and save your transactions',
            description: 'This is the final step. Nothing is saved until you select Save import.',
            currentStep: 3,
          };
    case 'NeedsMapping':
      return {
        title: stepTitles[status],
        description: 'Match the columns to the sample rows. Continue when the date and amount are correct.',
        currentStep: 1,
      };
    case 'Done':
      return {
        title: stepTitles[status],
        description: 'Your transactions have been saved. You can now find them in your account.',
        currentStep: 4,
      };
    case 'Cancelled':
    case 'Failed':
      return { title: stepTitles[status], description: 'You can start again with a new bank export.' };
    default:
      return {
        title: stepTitles[status],
        description: 'Follow the progress of your bank export here.',
        currentStep: status === 'Reading' ? 2 : 1,
      };
  }
}

function ImportStep({ job }: { job: ImportJob }) {
  if (isImportProcessing(job.status)) {
    return <ProcessingCard job={job} />;
  }
  switch (job.status) {
    case 'NeedsMapping':
      return <ImportMappingStep key={job.id} initialMapping={job.proposedMapping} job={job} />;
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
          <Link to='/finances/imports'>Back to imports</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
