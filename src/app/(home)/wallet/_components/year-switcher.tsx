'use client';

import * as React from 'react';
import { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';

import { cn } from '@/lib/classnames';
import { useSearchQuery } from '@/hooks/use-search-query';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// TODO dont hardcode, safe in DB or get currentyear
const yearGroups = [
  {
    label: 'Years',
    years: ['2023', '2022'],
  },
];

interface Props extends ComponentPropsWithoutRef<typeof PopoverTrigger> {}

export function YearSwitcher({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const { pushQueryString, isQuerySet, getQueryString } = useSearchQuery();
  const selectedYear = getQueryString('year', new Date().getFullYear().toString() ?? yearGroups[0].years[0]);

  useEffect(() => {
    if (!isQuerySet('year')) {
      pushQueryString('year', new Date().getFullYear().toString() ?? yearGroups[0].years[0]);
    }
  }, [isQuerySet, pushQueryString]);

  const handleSelectYear = (year: string) => {
    setOpen(false);
    pushQueryString('year', year);
  };

  return (
    <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            role='combobox'
            aria-expanded={open}
            aria-label='Select a year'
            className={cn('w-[200px] justify-between', className)}
          >
            {selectedYear}
            <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0'>
          <Command>
            <CommandList>
              <CommandInput placeholder='Search Year...' />
              <CommandEmpty>No Year found.</CommandEmpty>
              {yearGroups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.years.map((year) => (
                    <CommandItem key={year} onSelect={handleSelectYear} className='text-sm'>
                      {year}
                      <Check className={cn('ml-auto h-4 w-4', selectedYear === year ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewYearDialog(true);
                    }}
                  >
                    <PlusCircle className='mr-2 h-5 w-5' />
                    Add new year
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new Year</DialogTitle>
          <DialogDescription>Add a new year to manage.</DialogDescription>
        </DialogHeader>
        <div>
          <div className='space-y-4 py-2 pb-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Year</Label>
              <Input id='name' placeholder={(new Date().getFullYear() + 1).toString()} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setShowNewYearDialog(false)}>
            Cancel
          </Button>
          <Button type='submit'>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
