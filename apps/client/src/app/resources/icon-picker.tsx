import { Button } from '@kijk/ui/components/button';
import { Command, CommandInput } from '@kijk/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { ResourceIcon } from '@/shared/components/resource-icon';
import { formatResourceIconName, resourceIconNames } from '@/shared/lib/resource-icons';
const iconsPerRow = 4;
const estimatedRowHeight = 72;

interface Props {
  onChange: (value: string) => void;
  value: string;
}

/** Searchable popover to pick a resource icon. */
export function ResourceIconPicker({ onChange, value }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const selectedIcon = value || 'circle';

  const normalizedQuery = query.trim().toLowerCase();
  const matchingIcons = normalizedQuery
    ? resourceIconNames.filter((name) => name.includes(normalizedQuery))
    : resourceIconNames;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button className='w-full justify-between font-normal' type='button' variant='outline' />}
      >
        <span className='flex items-center gap-2'>
          <ResourceIcon className='size-4' name={selectedIcon} />
          {formatResourceIconName(selectedIcon)}
        </span>
        <ChevronsUpDown className='text-muted-foreground size-4' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-(--anchor-width) p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search Lucide icons…'
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              if (scrollElement) {
                scrollElement.scrollTo({ top: 0 });
              }
            }}
          />
          <IconGrid
            icons={matchingIcons}
            selectedIcon={selectedIcon}
            query={query}
            scrollElement={scrollElement}
            onScrollElementChange={setScrollElement}
            onSelect={(name) => {
              onChange(name);
              setOpen(false);
            }}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface IconGridProps {
  icons: readonly string[];
  selectedIcon: string;
  query: string;
  scrollElement: HTMLDivElement | null;
  onScrollElementChange: (element: HTMLDivElement | null) => void;
  onSelect: (name: string) => void;
}

function IconGrid({ icons, selectedIcon, query, scrollElement, onScrollElementChange, onSelect }: IconGridProps) {
  // Keep the mutable virtualizer isolated so the picker and its filtering remain compiler-compatible.
  // oxlint-disable-next-line react/incompatible-library, react-hooks-js/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(icons.length / iconsPerRow),
    estimateSize: () => estimatedRowHeight,
    getScrollElement: () => scrollElement,
    overscan: 3,
  });
  return (
    <div
      ref={onScrollElementChange}
      aria-label='All Lucide icons'
      className='h-72 max-h-72 [scrollbar-width:auto] overflow-y-scroll [&::-webkit-scrollbar]:block'
      role='listbox'
    >
      {icons.length === 0 && <div className='py-6 text-center text-sm'>No icons found.</div>}
      {icons.length > 0 && (
        <div className='text-muted-foreground px-3 py-1.5 text-xs font-medium'>
          {query ? 'Search results' : 'All icons'}
        </div>
      )}
      <div className='relative w-full' style={{ height: rowVirtualizer.getTotalSize() }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowIcons = icons.slice(virtualRow.index * iconsPerRow, virtualRow.index * iconsPerRow + iconsPerRow);

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
                    onSelect(name);
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
  );
}
