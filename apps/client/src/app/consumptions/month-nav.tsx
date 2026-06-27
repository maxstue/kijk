import { cn } from '@kijk/core/utils/style';
import { Button } from '@kijk/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@kijk/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { getRouteApi } from '@tanstack/react-router';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import type { Months } from '@/shared/utils/months';
import { formatMonth, monthSchema } from '@/shared/utils/months';

const Route = getRouteApi('/_protected/consumptions');

type Props = React.HTMLAttributes<HTMLElement>;

export function ConsumptionMonthNav({ className }: Props) {
  const [open, setOpen] = useState(false);
  const searchParameters = Route.useSearch();

  const navigate = Route.useNavigate();
  const { month } = searchParameters;

  const handleSelectMonth = (selectedMonth: Months) => {
    setOpen(false);
    navigate({ search: (previous) => ({ ...previous, month: selectedMonth }) });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label='Select a month'
          className={cn('w-full justify-between', className)}
          role='combobox'
          aria-controls='consumptions-month-nav'
          variant='outline'
        >
          {formatMonth(month)}
          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-50 p-0'>
        <Command>
          <CommandList>
            <CommandInput placeholder='Search Months...' />
            <CommandEmpty>No Month found.</CommandEmpty>
            <CommandGroup key='Months' heading='Months'>
              {monthSchema.options.map((m) => {
                const label = formatMonth(m);

                return (
                  <CommandItem
                    key={m}
                    className='text-sm'
                    keywords={[label]}
                    value={m}
                    onSelect={() => {
                      handleSelectMonth(m);
                    }}
                  >
                    {label}
                    <Check className={cn('ml-auto h-4 w-4', month === m ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
