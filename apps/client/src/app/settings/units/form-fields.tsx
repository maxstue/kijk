import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { Info } from 'lucide-react';
import type { Control } from 'react-hook-form';

import type { Unit } from '@/shared/api/units/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { UnitSelectOptions } from '@/shared/components/unit-select-options';

import type { CreateUnitFormValues } from './schemas';

export function UnitFormFields({
  control,
  systemUnits,
}: {
  control: Control<CreateUnitFormValues>;
  systemUnits: Unit[];
}) {
  return (
    <>
      <FormField
        control={control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input maxLength={50} placeholder='e.g. Barrel' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='symbol'
        render={({ field }) => (
          <FormItem>
            <div className='flex items-center gap-1.5'>
              <FormLabel>Symbol</FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label='What is a unit symbol?'
                    className='text-muted-foreground hover:text-foreground'
                    type='button'
                  >
                    <Info className='size-4' />
                  </button>
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
      <FormField
        control={control}
        name='referenceUnitId'
        render={({ field }) => (
          <FormItem>
            <div className='flex items-center gap-1.5'>
              <FormLabel>Reference unit</FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label='What is a reference unit?'
                    className='text-muted-foreground hover:text-foreground'
                    type='button'
                  >
                    <Info className='size-4' />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  The reference unit says what your new unit equals. Example: 1 barrel = 200 liters. Choose Liter here
                  and enter 200 as the factor.
                </TooltipContent>
              </Tooltip>
            </div>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a reference unit' />
                </SelectTrigger>
                <SelectContent>
                  <UnitSelectOptions units={systemUnits} />
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='conversionFactor'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Conversion factor</FormLabel>
            <FormControl>
              <Input min='0' placeholder='Reference units per custom unit' step='any' type='number' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
