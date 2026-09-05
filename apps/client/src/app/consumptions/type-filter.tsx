import { cn } from '@kijk/core/utils/style';
import { Button } from '@kijk/ui/components/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@kijk/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import type { Consumption } from '@/shared/types/domain';

export const allResourceTypes = 'all';

interface Props {
  onSelect: (resourceId: string) => void;
  resources: Array<Consumption['resource']>;
  value: string;
}

export function ConsumptionTypeFilter({ onSelect, resources, value }: Props) {
  const [open, setOpen] = useState(false);
  const selectedName =
    value === allResourceTypes
      ? 'All types'
      : (resources.find((resource) => resource.id === value)?.name ?? 'All types');

  const handleSelect = (resourceId: string) => {
    onSelect(resourceId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label='Filter consumptions by type'
          className='w-full justify-between sm:w-64'
          role='combobox'
          variant='outline'
        >
          {selectedName}
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
        <Command>
          <CommandInput placeholder='Search types...' />
          <CommandList>
            <CommandEmpty>No type found.</CommandEmpty>
            <TypeOption
              label='All types'
              selected={value === allResourceTypes}
              onSelect={() => handleSelect(allResourceTypes)}
            />
            {resources.map((resource) => (
              <TypeOption
                key={resource.id}
                label={resource.name}
                selected={value === resource.id}
                onSelect={() => handleSelect(resource.id)}
              />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function TypeOption({ label, onSelect, selected }: { label: string; onSelect: () => void; selected: boolean }) {
  return (
    <CommandItem value={label} onSelect={onSelect}>
      <Check className={cn('mr-2 size-4', selected ? 'opacity-100' : 'opacity-0')} />
      {label}
    </CommandItem>
  );
}
