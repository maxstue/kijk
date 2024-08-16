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
          className={cn('w-[240px] justify-start text-left font-normal', !date && 'text-muted-foreground', className)}
          id='date'
          size='sm'
          variant={'outline'}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? format(date, 'LLL dd, y') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent ref={ref} align='end' className='w-auto p-0'>
        <Calendar
          {...props}
          autoFocus
          defaultMonth={date}
          mode='single'
          selected={date}
          onSelect={(data) => {
            setDate(data);
          }}
        />
      </PopoverContent>
    </Popover>
  );
});

DatePicker.displayName = 'DatePicker';

export { DatePicker };
