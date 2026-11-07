import type { ImportJob } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Label } from '@kijk/ui/components/label';
import { cn } from 'cn';
import { useId } from 'react';

import { formatImportMonth } from '@/app/imports/helpers';

interface MonthSelectionProps {
  job: ImportJob;
  included: Set<string>;
  months: Set<string>;
  isPending: boolean;
  onToggle: (month: string, checked: boolean) => void;
  onCancel: () => void;
  onContinue: () => void;
}

export function MonthSelection({
  job,
  included,
  months,
  isPending,
  onToggle,
  onCancel,
  onContinue,
}: MonthSelectionProps) {
  const monthLabel = months.size === 1 ? 'month' : 'months';
  return (
    <div className='flex flex-col gap-6'>
      <section aria-label='Months to import' className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Saving replaces previously imported transactions in the selected months. Manually added transactions stay.
        </p>
        <div className='space-y-3'>
          {job.fullMonths.map((month) => (
            <div key={month} className='flex items-center gap-3 rounded-md border px-4 py-4 text-sm'>
              <Checkbox checked disabled aria-label={`${formatImportMonth(month)} included`} />
              <span className='flex-1 font-medium'>{formatImportMonth(month)}</span>
              <span className='text-muted-foreground text-xs'>Complete month · included</span>
            </div>
          ))}
          {job.edgeMonths.map((month) => (
            <EdgeMonth
              key={month}
              checked={included.has(month)}
              month={month}
              onCheckedChange={(checked) => onToggle(month, checked)}
            />
          ))}
        </div>
        <p className='text-muted-foreground min-h-10 text-sm' aria-live='polite'>
          {months.size === 0
            ? 'Select at least one month to continue.'
            : `${months.size} ${monthLabel} selected. You can check the transactions next.`}
        </p>
      </section>
      <div className='flex items-center justify-between gap-3 border-t pt-5'>
        <Button disabled={isPending} variant='ghost' onClick={() => onCancel()}>
          Cancel import
        </Button>
        <Button disabled={isPending || months.size === 0} onClick={() => onContinue()}>
          Continue to review
        </Button>
      </div>
    </div>
  );
}

interface EdgeMonthProps {
  checked: boolean;
  month: string;
  onCheckedChange: (checked: boolean) => void;
}

function EdgeMonth({ checked, month, onCheckedChange }: EdgeMonthProps) {
  const id = useId();
  return (
    <Label
      htmlFor={id}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-md border px-4 py-4 text-sm',
        checked ? 'border-primary/40 bg-primary/5' : 'border-amber-500/50 bg-amber-500/5',
      )}
    >
      <Checkbox
        aria-label={`Import partial month ${formatImportMonth(month)} anyway`}
        checked={checked}
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className='space-y-1'>
        <span className='block'>
          {formatImportMonth(month)} <span className='text-muted-foreground font-normal'>· partial month</span>
        </span>
        <span className='text-muted-foreground block text-xs font-normal'>
          The export does not appear to cover this entire month. Import these transactions anyway?
        </span>
      </span>
    </Label>
  );
}
