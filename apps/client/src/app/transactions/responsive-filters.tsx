import { Button } from '@kijk/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
interface ResponsiveTransactionFiltersProps {
  children: ReactNode;
  mobile: ReactNode;
}
export function ResponsiveTransactionFilters({ children, mobile }: ResponsiveTransactionFiltersProps) {
  return (
    <>
      <div className='hidden items-center gap-2 @min-[60rem]/toolbar:flex'>{children}</div>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              aria-label='Filters'
              title='Filters'
              variant='outline'
              className='size-9 p-0 @min-[32rem]/toolbar:w-auto @min-[32rem]/toolbar:px-3 @min-[60rem]/toolbar:hidden'
            />
          }
        >
          <SlidersHorizontal />
          <span className='sr-only @min-[32rem]/toolbar:not-sr-only'>Filters</span>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-96 max-w-[calc(100vw-2rem)]'>
          <div className='flex flex-col items-start gap-3'>{mobile}</div>
        </PopoverContent>
      </Popover>
    </>
  );
}
