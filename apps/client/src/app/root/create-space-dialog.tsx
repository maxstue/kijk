import { zodResolver } from '@hookform/resolvers/zod';
import * as spacesOptions from '@kijk/api/spaces/options';
import { Button } from '@kijk/ui/components/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Form } from '@/shared/components/form';
import { SpaceDetailsFields } from '@/shared/components/space-details-fields';
import { spaceDetailsSchema } from '@/shared/lib/space-details';
import type { SpaceDetailsFormValues } from '@/shared/lib/space-details';

interface Props {
  onClose: () => void;
}

/** Dialog that creates a shared space with the current user as admin and then opens it. */
export function CreateSpaceDialog({ onClose }: Props) {
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation(spacesOptions.createMutationOptions());
  const form = useForm<SpaceDetailsFormValues>({
    defaultValues: { description: '', name: '' },
    resolver: zodResolver(spaceDetailsSchema),
  });

  function onSubmit(values: SpaceDetailsFormValues) {
    mutate(
      { description: values.description.trim() || null, name: values.name.trim() },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: (space) => {
          form.reset();
          onClose();
          toast.success(`${space.name} created`);
          void navigate({ to: '/$spaceId', params: { spaceId: space.id } });
        },
      },
    );
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create space</DialogTitle>
        <DialogDescription>
          A space keeps its own consumptions, limits and finances, for example for a holiday home. You become its admin.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form className='space-y-6' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <SpaceDetailsFields control={form.control} disabled={isPending} />
          <DialogFooter>
            <Button disabled={isPending} type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={isPending} type='submit'>
              {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Create space'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
