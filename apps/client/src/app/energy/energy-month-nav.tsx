import { Suspense, useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { cn } from '@/shared/lib/helpers';
import { Months, months } from '@/shared/types/app';

const Route = getRouteApi('/_protected/energy');

type Props = React.HTMLAttributes<HTMLElement>;

export function EnergyMonthNav({ className }: Props) {
  const [open, setOpen] = useState(false);
  const searchParameters = Route.useSearch();

  const navigate = Route.useNavigate();

  const selectedYear = searchParameters.month;

  const handleSelectMonth = (month: string) => {
    setOpen(false);
    navigate({ search: (previous) => ({ ...previous, month: month as Months }) });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label='Select a year'
          className={cn('w-full justify-between', className)}
          role='combobox'
          variant='outline'
        >
          {selectedYear}
          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command>
          <CommandList>
            <CommandInput placeholder='Search Months...' />
            <CommandEmpty>No Month found.</CommandEmpty>
            <Suspense fallback={<AsyncLoader />}>
              <CommandGroup key='Months' heading='Months'>
                {months.map((m) => (
                  <CommandItem
                    key={m}
                    className='text-sm'
                    onSelect={(y) => {
                      handleSelectMonth(y);
                    }}
                  >
                    {m}
                    <Check className={cn('ml-auto h-4 w-4', selectedYear === m ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Suspense>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
