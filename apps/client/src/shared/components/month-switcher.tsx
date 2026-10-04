import { Button } from '@kijk/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatMonthYear, shiftMonth } from '@/shared/utils/months';

interface Props {
  /** The selected month (1-12). */
  month: number;
  onChange: (value: { month: number; year: number }) => void;
  year: number;
}

/** Previous/next buttons around the localized name of the selected month. */
export function MonthSwitcher({ month, onChange, year }: Props) {
  const label = formatMonthYear(year, month);

  return (
    <div className='flex items-center gap-2'>
      <Button
        aria-label='Previous month'
        size='icon'
        variant='outline'
        onClick={() => onChange(shiftMonth(year, month, -1))}
      >
        <ChevronLeft />
      </Button>
      <span className='min-w-36 text-center font-medium'>{label}</span>
      <Button
        aria-label='Next month'
        size='icon'
        variant='outline'
        onClick={() => onChange(shiftMonth(year, month, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
