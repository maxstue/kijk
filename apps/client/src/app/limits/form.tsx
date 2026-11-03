import { zodResolver } from '@hookform/resolvers/zod';
import * as limitsOptions from '@kijk/api/limits/options';
import type { Limit } from '@kijk/api/limits/types';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { LimitFormValues } from '@/app/limits/schemas';
import { limitSchema } from '@/app/limits/schemas';
import { Form } from '@/shared/components/form';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import {
  NameField,
  ResourceField,
  LimitField,
  PeriodField,
  DescriptionField,
  ActiveField,
  SubmitButton,
} from './form-fields';

interface Props {
  initialData?: Limit;
  onClose: () => void;
}

const createDefaultValues: LimitFormValues = {
  active: true,
  description: '',
  limit: 0,
  name: '',
  period: 'Month',
  resourceId: '',
};

/** Form to create a limit, or to edit `initialData` when given. */
export function LimitForm({ initialData, onClose }: Props) {
  const spaceId = useSpaceId();
  const canPlan = useSpacePermission(SpacePermissions.limits.plan);
  const createMutation = useMutation(limitsOptions.createMutationOptions(spaceId));
  const updateMutation = useMutation(limitsOptions.updateMutationOptions(spaceId));
  const isPending = createMutation.isPending || updateMutation.isPending;
  const form = useForm<LimitFormValues>({
    defaultValues: initialData ? getUpdateDefaultValues(initialData) : createDefaultValues,
    resolver: zodResolver(limitSchema),
  });

  function onSubmit(values: LimitFormValues) {
    if (!canPlan) {
      return;
    }
    const onError = (error: Error) => toast.error(error.name, { description: error.message });
    const onSuccess = () => {
      toast.success(initialData ? 'Limit updated' : 'Limit created');
      onClose();
    };

    if (initialData) {
      const { resourceId: _, ...limit } = values;
      updateMutation.mutate({ id: initialData.id, limit }, { onError, onSuccess });
      return;
    }

    createMutation.mutate(values, { onError, onSuccess });
  }

  return (
    <Form {...form}>
      <form className='grid gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <NameField />
        <ResourceField disabled={Boolean(initialData)} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <LimitField />
          <PeriodField />
        </div>
        <DescriptionField />
        <ActiveField />
        <SubmitButton isEditing={Boolean(initialData)} isPending={isPending} />
      </form>
    </Form>
  );
}

function getUpdateDefaultValues(initialData: Limit): LimitFormValues {
  return {
    active: initialData.active,
    description: initialData.description ?? '',
    limit: Number(initialData.limit),
    name: initialData.name,
    period: initialData.period,
    resourceId: initialData.resource.id,
  };
}
