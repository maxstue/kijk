import { Button } from '@kijk/ui/components/button';
import { ButtonGroup, ButtonGroupText } from '@kijk/ui/components/button-group';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { formatMonthYear, shiftMonth } from '@/shared/utils/months';

interface Props {
  /** The selected month (1-12). */
  month: number;
  onChange: (value: { month: number; year: number }) => void;
  year: number;
}

function getCurrentMonth() {
  const today = new Date();
  return { month: today.getMonth() + 1, year: today.getFullYear() };
}

/** Month navigation with a shortcut back to the current month when another month is selected. */
export function MonthSwitcher({ month, onChange, year }: Props) {
  const label = formatMonthYear(year, month);
  // Read once per mount so rendering stays pure.
  const [current] = useState(getCurrentMonth);
  const isCurrent = current.month === month && current.year === year;

  return (
    <div className='flex max-w-full flex-wrap items-center gap-2'>
      <ButtonGroup aria-label='Month'>
        <Button
          aria-label='Previous month'
          size='icon'
          variant='outline'
          onClick={() => onChange(shiftMonth(year, month, -1))}
        >
          <ChevronLeft />
        </Button>
        <ButtonGroupText
          aria-live='polite'
          className='bg-background dark:border-input dark:bg-input/30 min-w-36 justify-center'
        >
          {label}
        </ButtonGroupText>
        <Button
          aria-label='Next month'
          size='icon'
          variant='outline'
          onClick={() => onChange(shiftMonth(year, month, 1))}
        >
          <ChevronRight />
        </Button>
      </ButtonGroup>
      {!isCurrent && (
        <Button variant='outline' onClick={() => onChange(current)}>
          Current month
        </Button>
      )}
    </div>
  );
}
