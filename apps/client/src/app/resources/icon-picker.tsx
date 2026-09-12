import { Button } from '@kijk/ui/components/button';
import { Command, CommandInput } from '@kijk/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ResourceIcon } from '@/shared/components/resource-icon';
import { formatResourceIconName, resourceIconNames } from '@/shared/lib/resource-icons';

const iconsPerRow = 4;
const estimatedRowHeight = 72;

interface Props {
  onChange: (value: string) => void;
  value: string;
}

export function ResourceIconPicker({ onChange, value }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const selectedIcon = value || 'circle';

  const matchingIcons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery ? resourceIconNames.filter((name) => name.includes(normalizedQuery)) : resourceIconNames;
  }, [query]);

  const rowCount = Math.ceil(matchingIcons.length / iconsPerRow);

  // TanStack Virtual manages mutable measurements internally; React Compiler intentionally skips this component.
  // oxlint-disable-next-line react/incompatible-library, react-hooks-js/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: () => estimatedRowHeight,
    getScrollElement: () => scrollElement,
    overscan: 3,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className='w-full justify-between font-normal' type='button' variant='outline'>
          <span className='flex items-center gap-2'>
            <ResourceIcon className='size-4' name={selectedIcon} />
            {formatResourceIconName(selectedIcon)}
          </span>
          <ChevronsUpDown className='text-muted-foreground size-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search Lucide icons…'
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              rowVirtualizer.scrollToOffset(0);
            }}
          />
          <div
            ref={setScrollElement}
            aria-label='All Lucide icons'
            className='h-72 max-h-72 overflow-y-scroll [scrollbar-width:auto] [&::-webkit-scrollbar]:block'
            role='listbox'
          >
            {matchingIcons.length === 0 && <div className='py-6 text-center text-sm'>No icons found.</div>}
            {matchingIcons.length > 0 && (
              <div className='text-muted-foreground px-3 py-1.5 text-xs font-medium'>
                {query ? 'Search results' : 'All icons'}
              </div>
            )}
            <div className='relative w-full' style={{ height: rowVirtualizer.getTotalSize() }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rowIcons = matchingIcons.slice(
                  virtualRow.index * iconsPerRow,
                  virtualRow.index * iconsPerRow + iconsPerRow,
                );

                return (
                  <div
                    key={virtualRow.key}
                    className='absolute top-0 left-0 grid w-full grid-cols-4 gap-1 p-1'
                    style={{ height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {rowIcons.map((name) => (
                      <button
                        key={name}
                        aria-label={formatResourceIconName(name)}
                        aria-selected={name === selectedIcon}
                        className='hover:bg-muted focus-visible:ring-ring flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm px-1 text-center outline-none focus-visible:ring-2'
                        role='option'
                        type='button'
                        onClick={() => {
                          onChange(name);
                          setOpen(false);
                        }}
                      >
                        <ResourceIcon className='size-5' name={name} />
                        <span className='w-full truncate text-[10px]'>{formatResourceIconName(name)}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
