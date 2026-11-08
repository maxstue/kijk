import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { Button } from '@kijk/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@kijk/ui/components/command';
import { Dialog } from '@kijk/ui/components/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { cn } from 'cn';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import { useSpaceId } from '@/shared/hooks/use-active-space';

import { AddNewYearDialog } from './add-year-dialog';

const Route = getRouteApi('/_authenticated/_app/$spaceId/consumptions/_overview');

interface ConsumptionYearSwitcherProps extends ComponentPropsWithoutRef<typeof PopoverTrigger> {}

/** Year picker that updates the `year` search param and can add a year without entries. */
export function ConsumptionYearSwitcher({ className }: ConsumptionYearSwitcherProps) {
  const spaceId = useSpaceId();
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const searchParameters = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data } = useSuspenseQuery(consumptionsOptions.yearsQueryOptions(spaceId));
  const selectedYear = searchParameters.year;
  const years = [...new Set([...data.years.map(Number), selectedYear])].sort((left, right) => right - left);

  const handleSelectYear = (year: number) => {
    setOpen(false);
    navigate({ search: (previous) => ({ ...previous, year }) });
  };

  const handleNewYearClick = () => {
    setOpen(false);
    setShowNewYearDialog(true);
  };

  const handleCloseNewYearDialog = () => {
    setShowNewYearDialog(false);
  };

  return (
    <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-expanded={open}
              aria-label='Select a year'
              className={cn('w-full justify-between', className)}
              role='combobox'
              aria-controls='year-popover'
              variant='outline'
            />
          }
        >
          {selectedYear}
          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </PopoverTrigger>
        <PopoverContent className='w-50 p-0'>
          <Command>
            <CommandList>
              <CommandInput placeholder='Search Year...' />
              <CommandEmpty>No Year found.</CommandEmpty>
              <CommandGroup key='years' heading='Years'>
                {years.map((yearData) => (
                  <CommandItem
                    key={yearData}
                    className='text-sm'
                    onSelect={(y) => {
                      handleSelectYear(Number(y));
                    }}
                  >
                    {yearData}
                    <Check className={cn('ml-auto h-4 w-4', selectedYear === yearData ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem onSelect={handleNewYearClick}>
                  <PlusCircle className='mr-2 h-5 w-5' />
                  Add new year
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddNewYearDialog onClose={handleCloseNewYearDialog} />
    </Dialog>
  );
}
