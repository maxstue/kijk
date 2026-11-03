import * as resourcesOptions from '@kijk/api/resources/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Switch } from '@kijk/ui/components/switch';
import { Textarea } from '@kijk/ui/components/textarea';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

import type { LimitFormValues } from '@/app/limits/schemas';
import { periods } from '@/app/limits/schemas';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

export function NameField() {
  const { control } = useFormContext<LimitFormValues>();
  return (
    <FormField
      control={control}
      name='name'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input maxLength={100} placeholder='Monthly electricity target' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface ResourceFieldProps {
  disabled: boolean;
}

export function ResourceField({ disabled }: ResourceFieldProps) {
  const form = useFormContext<LimitFormValues>();
  const spaceId = useSpaceId();
  const { data: resources } = useSuspenseQuery(resourcesOptions.listQueryOptions(spaceId));
  return (
    <FormField
      control={form.control}
      name='resourceId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Resource</FormLabel>
          <Select
            disabled={disabled}
            items={resources.map((resource) => ({ label: `${resource.name} (${resource.unit})`, value: resource.id }))}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder='Select an energy type' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {resources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.name} ({resource.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function LimitField() {
  const form = useFormContext<LimitFormValues>();
  return (
    <FormField
      control={form.control}
      name='limit'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Limit</FormLabel>
          <FormControl>
            <Input
              min='0'
              step='any'
              type='number'
              {...field}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PeriodField() {
  const form = useFormContext<LimitFormValues>();
  return (
    <FormField
      control={form.control}
      name='period'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Period</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function DescriptionField() {
  const form = useFormContext<LimitFormValues>();
  return (
    <FormField
      control={form.control}
      name='description'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea maxLength={250} placeholder='Optional note about this limit' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ActiveField() {
  const form = useFormContext<LimitFormValues>();
  return (
    <FormField
      control={form.control}
      name='active'
      render={({ field }) => (
        <FormItem className='flex items-center justify-between rounded-md border p-3'>
          <div>
            <FormLabel>Active</FormLabel>
            <FormDescription>Include this limit in consumption warnings.</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

interface SubmitButtonProps {
  isEditing: boolean;
  isPending: boolean;
}

export function SubmitButton({ isEditing, isPending }: SubmitButtonProps) {
  const form = useFormContext<LimitFormValues>();
  const canPlan = useSpacePermission(SpacePermissions.limits.plan);
  const label = isEditing ? 'Update limit' : 'Create limit';

  return (
    <Button
      className='mt-2'
      disabled={!canPlan || isPending || (isEditing && !form.formState.isDirty)}
      title={canPlan ? undefined : 'Your role in this space does not allow planning limits'}
      type='submit'
    >
      {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : label}
    </Button>
  );
}
