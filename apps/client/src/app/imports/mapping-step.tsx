import * as importsOptions from '@kijk/api/imports/options';
import type { CsvImportMapping, ImportJob, ImportPreview } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { assignColumnRole, createEmptyMapping, getColumnRoles, getMissingMappingFields } from '@/app/imports/helpers';
import { useSpaceId } from '@/shared/hooks/use-active-space';

import { ColumnRoleSelect } from './column-role-select';
import { FormatOptions } from './format-options';

const proposalDescriptions: Record<NonNullable<ImportJob['proposedMappingSource']> | 'None', string> = {
  Ai: 'The AI suggested this mapping from the column names and masked value patterns; it never saw your data.',
  None: 'Kijk could not recognize the columns. Choose which column holds which value.',
  Profile: 'This mapping was confirmed before for the same export format.',
  Suggestion: 'Kijk suggested a mapping from the column names. Check it against the first rows before importing.',
};

interface ImportMappingStepProps {
  initialMapping: CsvImportMapping | null;
  job: ImportJob;
}

/** Step that lets the user check and correct the column mapping against the first rows of the file. */
export function ImportMappingStep({ initialMapping, job }: ImportMappingStepProps) {
  const spaceId = useSpaceId();
  // A draft the user edits; it starts from the proposal and is sent only when confirmed.
  const [mapping, setMapping] = useState<CsvImportMapping | null>(initialMapping);
  const format = mapping
    ? { delimiter: mapping.delimiter, encoding: mapping.encoding, headerRowIndex: Number(mapping.headerRowIndex) }
    : {};
  const { data: preview, isFetching } = useQuery({
    ...importsOptions.filePreviewQueryOptions(spaceId, job.id, format),
    placeholderData: keepPreviousData,
  });

  if (!preview) {
    return <SpinnerIcon className='size-6 animate-spin' />;
  }

  const current = mapping ?? createEmptyMapping(preview);
  return <MappingCard job={job} mapping={current} preview={preview} updating={isFetching} onChange={setMapping} />;
}

interface MappingCardProps {
  job: ImportJob;
  mapping: CsvImportMapping;
  preview: ImportPreview;
  updating: boolean;
  onChange: (mapping: CsvImportMapping) => void;
}

function MappingCard({ job, mapping, onChange, preview, updating }: MappingCardProps) {
  const spaceId = useSpaceId();
  const confirmMutation = useMutation(importsOptions.confirmMappingMutationOptions(spaceId, job.id));
  const roles = getColumnRoles(mapping);
  const missing = getMissingMappingFields(mapping);
  // CSV positions identify columns and records even when their contents are duplicated or remapped.
  const columns = preview.headers.map((header, index) => ({ id: `column-${index}`, header, index }));
  const rows = preview.rows.map((cells, index) => ({
    id: `record-${Number(mapping.headerRowIndex) + index + 1}`,
    cells,
  }));

  function onConfirm() {
    confirmMutation.mutate(mapping, {
      onError: (error) => toast.error('The mapping does not fit the file', { description: error.message }),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column preview</CardTitle>
        <CardDescription>
          {proposalDescriptions[job.proposedMappingSource ?? 'None']} Confirmed mappings are remembered for the next
          export of this bank.
        </CardDescription>
        {job.aiUnavailable && (
          <p className='text-muted-foreground text-sm'>
            The AI format detection could not be reached; check the columns carefully.
          </p>
        )}
      </CardHeader>
      <CardContent className='space-y-6'>
        <details className='rounded-lg border p-4'>
          <summary className='cursor-pointer text-sm font-medium'>Adjust file format</summary>
          <div className='pt-4'>
            <FormatOptions mapping={mapping} recordCount={Number(preview.recordCount)} onChange={onChange} />
          </div>
        </details>
        <div className={updating ? 'opacity-60' : undefined}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(({ id, header, index: column }) => (
                  <TableHead key={id} className='min-w-40 align-top'>
                    <ColumnRoleSelect
                      role={roles.get(column)}
                      onChange={(role) => onChange(assignColumnRole(mapping, column, role))}
                    />
                    <div className='text-muted-foreground mt-1 truncate text-xs'>
                      {header || `Column ${column + 1}`}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className='max-w-60 truncate'>
                      {row.cells[column.index]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className='flex-wrap justify-end gap-3 border-t pt-4'>
        {missing && <span className='text-muted-foreground text-sm'>{missing}</span>}
        <Button disabled={Boolean(missing) || confirmMutation.isPending || updating} onClick={onConfirm}>
          {confirmMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Continue to review'}
        </Button>
      </CardFooter>
    </Card>
  );
}
