import { PropsWithChildren } from 'react';
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValue,
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
  UseFormStateReturn,
  useWatch,
} from 'react-hook-form';

import { EnergyFormSchema } from '@/app/energy/schemas';
import { DatePicker } from '@/shared/components/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { EnergyType, EnergyTypes } from '@/shared/types/app';

interface Props extends PropsWithChildren {
  form: UseFormReturn<EnergyFormSchema>;
  onSubmit: SubmitHandler<EnergyFormSchema>;
  onInvalid?: SubmitErrorHandler<EnergyFormSchema>;
}

export function EnergyForm({ form, onSubmit, onInvalid, children }: Props) {
  return (
    <Form className='space-y-4' form={form} onInvalid={onInvalid} onSubmit={onSubmit}>
      <FormField control={form.control} name='name' render={NameField} />
      <FormField control={form.control} name='value' render={ValueField} />
      <FormField control={form.control} name='type' render={TypeField} />
      <FormField control={form.control} name='date' render={DateField} />
      {children}
    </Form>
  );
}

function NameField({ field }: { field: ControllerRenderProps<EnergyFormSchema, 'name'> }) {
  return (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input placeholder='Name' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function ValueField({ field }: { field: ControllerRenderProps<EnergyFormSchema, 'value'> }) {
  const type = useWatch<EnergyFormSchema, 'type'>({ name: 'type' });
  const unit =
    type === EnergyTypes.ELECTRICITY ? (
      <span className='text-md font-normal text-muted-foreground'>kWh</span>
    ) : (
      <span className='text-md font-normal text-muted-foreground'>
        m<sup>3</sup>
      </span>
    );

  return (
    <FormItem>
      <FormLabel>Amount ({unit})</FormLabel>
      <FormControl>
        <Input placeholder='Value in kWh' type='number' {...field} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function TypeField({ field }: { field: ControllerRenderProps<EnergyFormSchema, 'type'> }) {
  return (
    <FormItem>
      <FormLabel>Type</FormLabel>
      <Select defaultValue={field.value} onValueChange={field.onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder='Select an energy type' />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value={EnergyTypes.ELECTRICITY}>Electricity</SelectItem>
          <SelectItem value={EnergyTypes.WATER}>Water</SelectItem>
          <SelectItem value={EnergyTypes.GAS}>Gas</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
}

function DateField({ field }: { field: ControllerRenderProps<EnergyFormSchema, 'date'> }) {
  return (
    <FormItem>
      <FormLabel>Date</FormLabel>
      <FormControl>
        <DatePicker date={field.value} setDate={field.onChange} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
