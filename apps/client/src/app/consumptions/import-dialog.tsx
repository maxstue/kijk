import * as consumptionsOptions from '@kijk/api/consumptions/options';
import type { ConsumptionImportResult } from '@kijk/api/consumptions/types';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  CsvFileField,
  CsvFileFieldDescription,
  CsvFileFieldInput,
  CsvFileFieldLabel,
} from '@/shared/components/csv-file-field';
import {
  CsvRowErrors,
  CsvRowErrorsDescription,
  CsvRowErrorsList,
  CsvRowErrorsTitle,
} from '@/shared/components/csv-row-errors';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { ConsumptionImportTemplateButton } from './import-template-button';

const maxFileBytes = 1024 * 1024;

function notifyImported(result: ConsumptionImportResult) {
  const imported = Number(result.importedCount);
  const skipped = Number(result.skippedCount);
  const description = skipped > 0 ? `${skipped} rows already existed and were skipped.` : undefined;
  toast.success(imported > 0 ? `${imported} consumptions imported` : 'No new consumptions', { description });
}

/**
 * Imports consumptions from a CSV file. The file is imported completely or not at all; rows that already exist are
 * skipped, so the same file can be uploaded again after fixing it.
 */
export function ConsumptionImportDialog() {
  const spaceId = useSpaceId();
  const canRecord = useSpacePermission(SpacePermissions.consumptions.record);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  // Owned here and not by the dialog content, so a running import still reports its result after closing.
  const importMutation = useMutation(consumptionsOptions.importMutationOptions(spaceId));
  const rejected = importMutation.data && Number(importMutation.data.errorCount) > 0 ? importMutation.data : undefined;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    // Resetting a running mutation would drop its result toast.
    if (!nextOpen && !importMutation.isPending) {
      setFile(undefined);
      importMutation.reset();
    }
  };

  const handleFileChange = (nextFile: File | undefined) => {
    setFile(nextFile);
    // The input is disabled while importing; never detach a running import from its pending state.
    if (!importMutation.isPending) {
      importMutation.reset();
    }
  };

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      return;
    }
    importMutation.mutate(file, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: (result) => {
        if (Number(result.errorCount) > 0) {
          return;
        }
        notifyImported(result);
        handleOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            disabled={!canRecord}
            title={canRecord ? undefined : 'Your role in this space does not allow recording consumptions'}
            variant='outline'
          />
        }
      >
        <Upload />
        Import CSV
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import consumptions</DialogTitle>
          <DialogDescription>
            Rows that already exist are skipped, so you can upload the same file again.
          </DialogDescription>
        </DialogHeader>
        <form className='grid gap-4' onSubmit={handleSubmit}>
          <ul className='text-muted-foreground list-disc space-y-1 pl-4 text-sm'>
            <li>One row per reading with the columns of the template, as in a consumption export.</li>
            <li>Dates as 2026-01-31 and values without thousands separators.</li>
            <li>
              Value type <code>Absolute</code> for meter readings (default) or <code>Relative</code> for consumed
              amounts.
            </li>
            <li>
              <code>StartsNewMeterSegment</code> set to <code>true</code> marks the first reading of a new meter, e.g.
              after a meter replacement.
            </li>
            <li>Rows are only imported when every row of the file is valid.</li>
          </ul>
          <CsvFileField maxBytes={maxFileBytes} onFileChange={handleFileChange}>
            <CsvFileFieldLabel>CSV file</CsvFileFieldLabel>
            <CsvFileFieldDescription>
              The template contains the exact resource names and units of this space.{' '}
              <ConsumptionImportTemplateButton />
            </CsvFileFieldDescription>
            <CsvFileFieldInput disabled={importMutation.isPending} />
          </CsvFileField>
          {rejected && (
            <CsvRowErrors variant='destructive'>
              <CsvRowErrorsTitle>
                {rejected.errorCount} rows could not be imported, so nothing was saved
              </CsvRowErrorsTitle>
              <CsvRowErrorsDescription>
                <p>Fix the rows and upload the file again.</p>
                <CsvRowErrorsList open rows={rejected.errorSamples} total={Number(rejected.errorCount)} />
              </CsvRowErrorsDescription>
            </CsvRowErrors>
          )}
          <DialogFooter>
            <DialogClose render={<Button type='button' variant='outline' />}>Cancel</DialogClose>
            <Button disabled={!canRecord || !file || importMutation.isPending} type='submit'>
              {importMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : <Upload />}
              {importMutation.isPending ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
