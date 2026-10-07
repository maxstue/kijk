import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialog } from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Separator } from '@kijk/ui/components/separator';
import { Textarea } from '@kijk/ui/components/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { spaceUpdateSchema } from '@/app/settings/spaces/schemas';
import type { SpaceUpdateFormValues } from '@/app/settings/spaces/schemas';
import { queryKeys } from '@/shared/api/query-keys';
import { updateSpaceMutationOptions } from '@/shared/api/spaces/options';
import { SpacePermissions, hasSpacePermission } from '@/shared/api/spaces/permissions';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';

import { SpaceBackLink } from './back-link';
import { useSpaceSettings } from './context';
import { SpaceDeleteContent } from './delete-content';

/** General space settings: editable details and deletion, depending on the user's permissions. */
export function SpaceGeneral() {
  const { space } = useSpaceSettings();
  const canConfigure = hasSpacePermission(space, SpacePermissions.space.configure);
  // A personal space is created automatically and stays as long as the account exists.
  const canDelete = !space.isPersonal && hasSpacePermission(space, SpacePermissions.space.delete);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateMutation = useMutation(updateSpaceMutationOptions());

  const form = useForm<SpaceUpdateFormValues>({
    defaultValues: {
      description: space.description ?? '',
      name: space.name,
    },
    resolver: zodResolver(spaceUpdateSchema),
    values: {
      description: space.description ?? '',
      name: space.name,
    },
  });

  function onSubmit(values: SpaceUpdateFormValues) {
    updateMutation.mutate(
      {
        data: {
          description: values.description.trim() || null,
          name: values.name.trim(),
        },
        id: space.id,
      },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          void (async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
            await router.invalidate();
            toast.success('Space updated');
          })().catch((error: unknown) =>
            toast.error(error instanceof Error ? error.message : 'Could not refresh space settings'),
          );
        },
      },
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <SpaceBackLink />
      <div>
        <h2 className='text-lg font-medium'>General</h2>
        <p className='text-muted-foreground text-sm'>Basic information about {space.name}.</p>
      </div>
      <Separator />

      {canConfigure ? (
        <Form {...form}>
          <form className='space-y-6' noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space name</FormLabel>
                  <FormControl>
                    <Input maxLength={100} {...field} />
                  </FormControl>
                  <FormDescription>This name is visible to everyone in the space.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea maxLength={250} rows={4} {...field} />
                  </FormControl>
                  <FormDescription>Optional details about this space. Maximum 250 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={updateMutation.isPending || !form.formState.isDirty} type='submit'>
              {updateMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Save changes'}
            </Button>
          </form>
        </Form>
      ) : (
        <Card>
          <CardContent className='space-y-5'>
            <div>
              <div className='text-muted-foreground text-sm'>Name</div>
              <div className='font-medium'>{space.name}</div>
            </div>
            <Separator />
            <div>
              <div className='text-muted-foreground text-sm'>Description</div>
              <div>{space.description || 'No description added.'}</div>
            </div>
            <p className='text-muted-foreground text-sm'>
              Your role in this space does not allow editing these details.
            </p>
          </CardContent>
        </Card>
      )}

      {canDelete && (
        <>
          <Separator />
          <section className='border-destructive/50 space-y-4 rounded-lg border p-5'>
            <div className='space-y-1'>
              <h3 className='text-destructive font-medium'>Delete space</h3>
              <p className='text-muted-foreground text-sm'>
                Permanently remove this space and its data. This cannot be undone.
              </p>
            </div>
            <Button variant='destructive' onClick={() => setShowDeleteDialog(true)}>
              Delete space
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <SpaceDeleteContent onClose={() => setShowDeleteDialog(false)} />
            </AlertDialog>
          </section>
        </>
      )}
    </div>
  );
}
