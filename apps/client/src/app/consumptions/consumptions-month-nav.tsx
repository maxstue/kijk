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
import { Suspense, useState } from 'react';

import { Loader } from '@/shared/components/ui/loaders/loader';
import type { Months } from '@/shared/types/app';
import { months } from '@/shared/types/app';

const Route = getRouteApi('/_protected/consumptions');

type Props = React.HTMLAttributes<HTMLElement>;

export function ConsumptionsMonthNav({ className }: Props) {
  const [open, setOpen] = useState(false);
  const searchParameters = Route.useSearch();

  const navigate = Route.useNavigate();
  const { month } = searchParameters;

  const handleSelectMonth = (m: string) => {
    setOpen(false);
    navigate({ search: (previous) => ({ ...previous, month: m as Months }) });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label='Select a year'
          className={cn('w-full justify-between', className)}
          role='combobox'
          aria-controls='consumptions-month-nav'
          variant='outline'
        >
          {month}
          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command>
          <CommandList>
            <CommandInput placeholder='Search Months...' />
            <CommandEmpty>No Month found.</CommandEmpty>
            <Suspense fallback={<Loader />}>
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
                    <Check className={cn('ml-auto h-4 w-4', month === m ? 'opacity-100' : 'opacity-0')} />
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
