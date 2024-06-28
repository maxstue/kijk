import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { cn } from '@/shared/lib/helpers';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  date?: Date;
  setDate: (date?: Date) => void;
}

const DatePicker = forwardRef<HTMLInputElement, Props>(({ className, date, setDate, ...props }, ref) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id='date'
          variant={'outline'}
          size='sm'
          className={cn('w-[240px] justify-start text-left font-normal', !date && 'text-muted-foreground', className)}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? format(date, 'LLL dd, y') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent ref={ref} className='w-auto p-0' align='end'>
        <Calendar
          {...props}
          initialFocus
          mode='single'
          defaultMonth={date}
          selected={date}
          onSelect={(e) => setDate(e)}
        />
      </PopoverContent>
    </Popover>
  );
});

DatePicker.displayName = 'DatePicker';

export { DatePicker };
