import type { ImportCandidatePage } from '@kijk/api/imports/types';
import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Label } from '@kijk/ui/components/label';
import { useId } from 'react';

import {
  CsvRowErrors,
  CsvRowErrorsDescription,
  CsvRowErrorsList,
  CsvRowErrorsTitle,
} from '@/shared/components/csv-row-errors';

interface UnreadableRowsProps {
  review: ImportCandidatePage | undefined;
  requiresConfirmation: boolean;
  accepted: boolean;
  onAccept: (accepted: boolean) => void;
}

export function UnreadableRows({ review, requiresConfirmation, accepted, onAccept }: UnreadableRowsProps) {
  const id = useId();
  if (!review || Number(review.errorCount) === 0) {
    return null;
  }
  return (
    <CsvRowErrors className='mx-4 mb-4 w-auto' variant={requiresConfirmation ? 'destructive' : 'default'}>
      <CsvRowErrorsTitle>{review.errorCount} rows could not be read and will not be imported</CsvRowErrorsTitle>
      <CsvRowErrorsDescription>
        <CsvRowErrorsList rows={review.errorSamples} total={Number(review.errorCount)}>
          Show unreadable rows
        </CsvRowErrorsList>
        {requiresConfirmation && (
          <div className='mt-3 flex items-center gap-2'>
            <Checkbox checked={accepted} id={id} onCheckedChange={(checked) => onAccept(checked === true)} />
            <Label htmlFor={id}>Import the readable rows anyway</Label>
          </div>
        )}
      </CsvRowErrorsDescription>
    </CsvRowErrors>
  );
}

interface ReviewLoadingStateProps {
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}

export function ReviewLoadingState({ isError, isLoading, onRetry }: ReviewLoadingStateProps) {
  if (isError) {
    return (
      <Alert variant='destructive' className='mx-4 mb-4 w-auto'>
        <AlertTitle>Transactions could not be loaded</AlertTitle>
        <AlertDescription>
          <Button variant='outline' onClick={onRetry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (isLoading) {
    return (
      <output className='flex justify-center p-8'>
        <SpinnerIcon className='size-5 animate-spin' />
        Loading transactions…
      </output>
    );
  }
  return null;
}
