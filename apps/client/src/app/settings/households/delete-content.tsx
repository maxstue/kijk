import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kijk/ui/components/alert-dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteHouseholdMutationOptions } from '@/shared/api/households/options';
import { queryKeys } from '@/shared/api/query-keys';

import { useHouseholdSettings } from './context';

export function HouseholdDeleteContent({ onClose }: { onClose: () => void }) {
  const { household, user } = useHouseholdSettings();
  const [confirmation, setConfirmation] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isPending, mutate } = useMutation(deleteHouseholdMutationOptions());
  const hasAnotherHousehold = user.households?.some((entry) => entry.id !== household.id) ?? false;

  function handleDelete() {
    mutate(household.id, {
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        void (async () => {
          await queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
          toast.success(`Deleted household: ${household.name}`);
          onClose();
          await navigate({ replace: true, to: hasAnotherHousehold ? '/home' : '/welcome' });
        })().catch((error: unknown) =>
          toast.error(error instanceof Error ? error.message : 'Could not open the next page'),
        );
      },
    });
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {household.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes the household, its resources, consumption history, limits, shared unit access, and
          member links. Members with no other household will need to set up a new one. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className='space-y-2'>
        <label className='text-sm font-medium' htmlFor='household-delete-confirmation'>
          Type <span className='font-semibold'>{household.name}</span> to confirm.
        </label>
        <Input
          autoComplete='off'
          id='household-delete-confirmation'
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={isPending || confirmation.trim() !== household.name}
          variant='destructive'
          onClick={(event) => {
            event.preventDefault();
            handleDelete();
          }}
        >
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Delete household'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
