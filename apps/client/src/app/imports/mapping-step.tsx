import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import type { ColumnRole } from '@/app/imports/constants';
import { columnRoles, dateFormats, delimiters, encodings, ignoredColumn } from '@/app/imports/constants';
import { assignColumnRole, createEmptyMapping, getColumnRoles, getMissingMappingFields } from '@/app/imports/helpers';
import { useConfirmImportMapping } from '@/app/imports/use-import-mutations';
import { importPreviewQueryOptions } from '@/shared/api/imports/options';
import type { CsvImportMapping, ImportJob, ImportPreview } from '@/shared/api/imports/types';

const proposalDescriptions: Record<NonNullable<ImportJob['proposedMappingSource']> | 'None', string> = {
  Ai: 'The AI suggested this mapping from the column names and masked value patterns; it never saw your data.',
  None: 'Kijk could not recognize the columns. Choose which column holds which value.',
  Profile: 'This mapping was confirmed before for the same export format.',
  Suggestion: 'Kijk suggested a mapping from the column names. Check it against the first rows before importing.',
};

/** Step that lets the user check and correct the column mapping against the first rows of the file. */
export function ImportMappingStep({
  initialMapping,
  job,
}: {
  initialMapping: CsvImportMapping | null;
  job: ImportJob;
}) {
  // A draft the user edits; it starts from the proposal and is sent only when confirmed.
  const [mapping, setMapping] = useState<CsvImportMapping | null>(initialMapping);
  const format = mapping
    ? { delimiter: mapping.delimiter, encoding: mapping.encoding, headerRowIndex: Number(mapping.headerRowIndex) }
    : {};
  const { data: preview, isFetching } = useQuery({
    ...importPreviewQueryOptions(job.id, format),
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
  const confirmMutation = useConfirmImportMapping(job.id);
  const roles = getColumnRoles(mapping);
  const missing = getMissingMappingFields(mapping);

  function onConfirm() {
    confirmMutation.mutate(mapping, {
      onError: (error) => toast.error('The mapping does not fit the file', { description: error.message }),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check the columns</CardTitle>
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
        <FormatOptions mapping={mapping} recordCount={Number(preview.recordCount)} onChange={onChange} />
        <div className={updating ? 'opacity-60' : undefined}>
          <Table>
            <TableHeader>
              <TableRow>
                {preview.headers.map((header, column) => (
                  <TableHead key={`${column}-${header}`} className='min-w-40 align-top'>
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
              {preview.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {preview.headers.map((_, column) => (
                    <TableCell key={column} className='max-w-60 truncate'>
                      {row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        {missing && <span className='text-muted-foreground text-sm'>{missing}</span>}
        <Button disabled={Boolean(missing) || confirmMutation.isPending || updating} onClick={onConfirm}>
          {confirmMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Read the file'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ColumnRoleSelect({
  onChange,
  role,
}: {
  role: ColumnRole | undefined;
  onChange: (role: ColumnRole | undefined) => void;
}) {
  return (
    <Select
      value={role ?? ignoredColumn}
      onValueChange={(value) => onChange(value === ignoredColumn ? undefined : (value as ColumnRole))}
    >
      <SelectTrigger aria-label='Column content' className='w-full' size='sm'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ignoredColumn}>Not imported</SelectItem>
        {columnRoles.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FormatOptionsProps {
  mapping: CsvImportMapping;
  recordCount: number;
  onChange: (mapping: CsvImportMapping) => void;
}

function FormatOptions({ mapping, onChange, recordCount }: FormatOptionsProps) {
  const headerId = useId();

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
      <OptionSelect
        label='Delimiter'
        options={delimiters}
        value={mapping.delimiter}
        onChange={(delimiter) => onChange({ ...mapping, delimiter })}
      />
      <OptionSelect
        label='Encoding'
        options={encodings}
        value={mapping.encoding}
        onChange={(encoding) => onChange({ ...mapping, encoding })}
      />
      <div className='grid gap-2'>
        <Label htmlFor={headerId}>Header row</Label>
        <Input
          id={headerId}
          max={recordCount}
          min={1}
          type='number'
          value={Number(mapping.headerRowIndex) + 1}
          onChange={(event) => {
            const row = event.target.valueAsNumber;
            if (Number.isInteger(row) && row >= 1 && row <= recordCount) {
              onChange({ ...mapping, headerRowIndex: row - 1 });
            }
          }}
        />
      </div>
      <OptionSelect
        label='Date format'
        options={dateFormats.map((value) => ({ label: value, value }))}
        value={mapping.dateFormat}
        onChange={(dateFormat) => onChange({ ...mapping, dateFormat })}
      />
      <OptionSelect
        label='Decimal separator'
        options={[
          { label: 'Comma (1.234,56)', value: ',' },
          { label: 'Point (1,234.56)', value: '.' },
        ]}
        value={mapping.decimalSeparator}
        onChange={(decimalSeparator) => onChange({ ...mapping, decimalSeparator })}
      />
    </div>
  );
}

interface OptionSelectProps {
  label: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}

function OptionSelect({ label, onChange, options, value }: OptionSelectProps) {
  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
