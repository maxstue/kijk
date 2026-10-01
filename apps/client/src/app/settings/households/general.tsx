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

import { householdUpdateSchema } from '@/app/settings/households/schemas';
import type { HouseholdUpdateFormValues } from '@/app/settings/households/schemas';
import { updateHouseholdMutationOptions } from '@/shared/api/households/options';
import { HouseholdPermissions, hasHouseholdPermission } from '@/shared/api/households/permissions';
import { queryKeys } from '@/shared/api/query-keys';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';

import { HouseholdBackLink } from './back-link';
import { useHouseholdSettings } from './context';
import { HouseholdDeleteContent } from './delete-content';

export function HouseholdGeneral() {
  const { household } = useHouseholdSettings();
  const canConfigure = hasHouseholdPermission(household, HouseholdPermissions.household.configure);
  const canDelete = hasHouseholdPermission(household, HouseholdPermissions.household.delete);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateMutation = useMutation(updateHouseholdMutationOptions());

  const form = useForm<HouseholdUpdateFormValues>({
    defaultValues: {
      description: household.description ?? '',
      name: household.name,
    },
    resolver: zodResolver(householdUpdateSchema),
    values: {
      description: household.description ?? '',
      name: household.name,
    },
  });

  function onSubmit(values: HouseholdUpdateFormValues) {
    updateMutation.mutate(
      {
        data: {
          description: values.description.trim() || null,
          name: values.name.trim(),
        },
        id: household.id,
      },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          void (async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
            await router.invalidate();
            toast.success('Household updated');
          })().catch((error: unknown) =>
            toast.error(error instanceof Error ? error.message : 'Could not refresh household settings'),
          );
        },
      },
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <HouseholdBackLink />
      <div>
        <h2 className='text-lg font-medium'>General</h2>
        <p className='text-muted-foreground text-sm'>Basic information about {household.name}.</p>
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
                  <FormLabel>Household name</FormLabel>
                  <FormControl>
                    <Input maxLength={100} {...field} />
                  </FormControl>
                  <FormDescription>This name is visible to everyone in the household.</FormDescription>
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
                  <FormDescription>Optional details about this household. Maximum 250 characters.</FormDescription>
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
              <div className='font-medium'>{household.name}</div>
            </div>
            <Separator />
            <div>
              <div className='text-muted-foreground text-sm'>Description</div>
              <div>{household.description || 'No description added.'}</div>
            </div>
            <p className='text-muted-foreground text-sm'>Your household role does not allow editing these details.</p>
          </CardContent>
        </Card>
      )}

      {canDelete && (
        <>
          <Separator />
          <section className='border-destructive/50 space-y-4 rounded-lg border p-5'>
            <div className='space-y-1'>
              <h3 className='text-destructive font-medium'>Delete household</h3>
              <p className='text-muted-foreground text-sm'>
                Permanently remove this household and its data. This cannot be undone.
              </p>
            </div>
            <Button variant='destructive' onClick={() => setShowDeleteDialog(true)}>
              Delete household
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <HouseholdDeleteContent onClose={() => setShowDeleteDialog(false)} />
            </AlertDialog>
          </section>
        </>
      )}
    </div>
  );
}
