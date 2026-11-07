import { Input } from '@kijk/ui/components/input';
import { RadioGroup } from '@kijk/ui/components/radio-group';
import { useForm } from 'react-hook-form';

import type { UserStepFormDraft } from '@/app/welcome/schemas';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

import { Choice } from './choice';

interface SpaceStepProps {
  control: ReturnType<typeof useForm<UserStepFormDraft>>['control'];
}

export function SpaceStep({ control }: SpaceStepProps) {
  return (
    <div className='space-y-6'>
      <FormField
        control={control}
        name='spaceName'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Space name</FormLabel>
            <FormControl>
              <Input placeholder='My space' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='useDefaultResources'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resource types</FormLabel>
            <FormDescription>Start with every default resource type or with none.</FormDescription>
            <FormControl>
              <RadioGroup
                className='grid gap-3 pt-2 sm:grid-cols-2'
                value={field.value ? 'all' : 'none'}
                onValueChange={(value) => field.onChange(value === 'all')}
              >
                <Choice value='all' title='All defaults' description='Electricity, water, gas and other defaults.' />
                <Choice value='none' title='No defaults' description='Start empty and add resources yourself.' />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
