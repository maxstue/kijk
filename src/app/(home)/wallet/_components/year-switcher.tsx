'use client';

import * as React from 'react';
import { ComponentPropsWithoutRef, useState } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';

import { cn } from '@/lib/classnames';
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

const yearGroups = [
  {
    label: 'Years',
    years: ['2023', '2022'],
  },
];

type Year = (typeof yearGroups)[number]['years'][number];

type PopoverTriggerProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface Props extends PopoverTriggerProps {}

export function YearSwitcher({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<Year>(yearGroups[0].years[0]);

  // TODO update searchparams on select, https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams
  // calc current year from current date

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
                    <CommandItem
                      key={year}
                      onSelect={() => {
                        setSelectedYear(year);
                        setOpen(false);
                      }}
                      className='text-sm'
                    >
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
