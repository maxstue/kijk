import { Switch } from '@kijk/ui/components/switch';

import { FormControl, FormDescription, FormItem, FormLabel } from '@/shared/components/form';

interface Props {
  checked: boolean;
  description: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

/** Bordered form row with a label, a description and a switch; render it inside a `FormField`. */
export function FormSwitchItem({ checked, description, label, onCheckedChange }: Props) {
  return (
    <FormItem className='flex items-center justify-between gap-4 rounded-md border p-3'>
      <div>
        <FormLabel>{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
      </div>
      <FormControl>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </FormControl>
    </FormItem>
  );
}
