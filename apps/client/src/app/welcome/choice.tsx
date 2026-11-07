import { RadioGroupItem } from '@kijk/ui/components/radio-group';

import { FormControl, FormItem, FormLabel } from '@/shared/components/form';

interface ChoiceProps {
  description: string;
  title: string;
  value: string;
}

export function Choice({ description, title, value }: ChoiceProps) {
  return (
    <FormItem className='gap-0'>
      <FormLabel className='has-data-checked:border-primary flex w-full cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal'>
        <FormControl>
          <RadioGroupItem value={value} />
        </FormControl>
        <span className='min-w-0 flex-1'>
          <span className='block font-medium'>{title}</span>
          <span className='text-muted-foreground mt-1 block text-sm'>{description}</span>
        </span>
      </FormLabel>
    </FormItem>
  );
}
