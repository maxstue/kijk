import { Badge } from '@kijk/ui/components/badge';
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
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Check, PlusCircle, Tags } from 'lucide-react';

import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { ResourceIcon } from '@/shared/components/resource-icon';

interface Props {
  compact?: boolean;
  onChange: (categoryIds: string[]) => void;
  value: string[];
}

/** Faceted filter for the transaction list: pick any number of categories; none selected means all. */
export function TransactionCategoryFilter({ compact = false, onChange, value }: Props) {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const selected = new Set(value);
  const selectedCategories = categories.filter((category) => selected.has(category.id));

  function toggle(categoryId: string) {
    const next = new Set(selected);
    if (next.has(categoryId)) {
      next.delete(categoryId);
    } else {
      next.add(categoryId);
    }
    onChange([...next]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={compact ? 'Category' : undefined}
          title='Filter categories'
          className='border-dashed'
          variant='outline'
        >
          {compact ? <Tags /> : <PlusCircle />}
          <span className={compact ? 'hidden @min-[48rem]/toolbar:inline' : undefined}>Category</span>
          {compact && selectedCategories.length > 0 && (
            <Badge className='rounded-sm px-1 font-normal' variant='secondary'>
              {selectedCategories.length}
            </Badge>
          )}
          {!compact && selectedCategories.length > 0 && (
            <>
              <Separator className='mx-1 h-4' orientation='vertical' />
              {selectedCategories.length > 2 ? (
                <Badge className='rounded-sm px-1 font-normal' variant='secondary'>
                  {selectedCategories.length} selected
                </Badge>
              ) : (
                selectedCategories.map((category) => (
                  <Badge key={category.id} className='rounded-sm px-1 font-normal' variant='secondary'>
                    {category.name}
                  </Badge>
                ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-60 p-0'>
        <Command>
          <CommandInput placeholder='Search categories…' />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => {
                const isSelected = selected.has(category.id);
                return (
                  <CommandItem key={category.id} value={category.name} onSelect={() => toggle(category.id)}>
                    <span
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className='size-3' />
                    </span>
                    <ResourceIcon className='size-4' color={category.color} name={category.icon} />
                    <span className='truncate'>{category.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedCategories.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem className='justify-center text-center' onSelect={() => onChange([])}>
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
