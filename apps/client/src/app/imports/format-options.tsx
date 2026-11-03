import type { CsvImportMapping } from '@kijk/api/imports/types';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useId } from 'react';

import { dateFormats, delimiters, encodings } from '@/app/imports/constants';

interface FormatOptionsProps {
  mapping: CsvImportMapping;
  recordCount: number;
  onChange: (mapping: CsvImportMapping) => void;
}

export function FormatOptions({ mapping, onChange, recordCount }: FormatOptionsProps) {
  const headerId = useId();

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
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
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) {
            onChange(next);
          }
        }}
      >
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
