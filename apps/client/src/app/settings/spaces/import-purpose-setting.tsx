import { purposeRetentionLabels } from '@kijk/api/imports/constants';
import type { PurposeRetention } from '@kijk/api/imports/types';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useId } from 'react';

interface ImportPurposeSettingProps {
  value: PurposeRetention;
  disabled: boolean;
  onChange: (value: PurposeRetention) => void;
}
export function ImportPurposeSetting({ value, disabled, onChange }: ImportPurposeSettingProps) {
  const retentionId = useId();
  const retentions = Object.keys(purposeRetentionLabels) as PurposeRetention[];
  return (
    <div className='space-y-2'>
      <Label htmlFor={retentionId}>Purpose text</Label>
      <p className='text-muted-foreground text-sm'>
        IBANs, card and reference numbers are always removed. Choose how much of the remaining text new imports keep.
      </p>
      <Select
        disabled={disabled}
        items={purposeRetentionLabels}
        value={value}
        onValueChange={(value) => onChange(value as PurposeRetention)}
      >
        <SelectTrigger className='w-full sm:w-80' id={retentionId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {retentions.map((retention) => (
            <SelectItem key={retention} value={retention}>
              {purposeRetentionLabels[retention]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
