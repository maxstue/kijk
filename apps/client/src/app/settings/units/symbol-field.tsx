import { Input } from '@kijk/ui/components/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { Info } from 'lucide-react';
import type { Control } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

import type { CreateUnitFormValues } from './schemas';

interface UnitSymbolFieldProps {
  control: Control<CreateUnitFormValues>;
}
export function UnitSymbolField({ control }: UnitSymbolFieldProps) {
  return (
    <FormField
      control={control}
      name='symbol'
      render={({ field }) => (
        <FormItem>
          <div className='flex items-center gap-1.5'>
            <FormLabel>Symbol</FormLabel>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    aria-label='What is a unit symbol?'
                    className='text-muted-foreground hover:text-foreground'
                    type='button'
                  />
                }
              >
                <Info className='size-4' />
              </TooltipTrigger>
              <TooltipContent>
                The short text shown after a value, such as l, kg, or kWh. No icon is needed.
              </TooltipContent>
            </Tooltip>
          </div>
          <FormControl>
            <Input maxLength={20} placeholder='e.g. bbl' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
