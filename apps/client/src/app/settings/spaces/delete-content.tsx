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

import { queryKeys } from '@/shared/api/query-keys';
import { deleteSpaceMutationOptions } from '@/shared/api/spaces/options';

import { useSpaceSettings } from './context';
import { clearSpaceData } from './helpers';

/** Confirmation dialog content for deleting the space with all of its data. */
export function SpaceDeleteContent({ onClose }: { onClose: () => void }) {
  const { space, user } = useSpaceSettings();
  const [confirmation, setConfirmation] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isPending, mutate } = useMutation(deleteSpaceMutationOptions());
  const hasAnotherSpace = user.spaces?.some((entry) => entry.id !== space.id) ?? false;

  function handleDelete() {
    mutate(space.id, {
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        void (async () => {
          await clearSpaceData(queryClient);
          await queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
          toast.success(`Deleted space: ${space.name}`);
          onClose();
          await navigate({ replace: true, to: hasAnotherSpace ? '/home' : '/welcome' });
        })().catch((error: unknown) =>
          toast.error(error instanceof Error ? error.message : 'Could not open the next page'),
        );
      },
    });
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {space.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes the space, its resources, consumption history, limits, shared unit access, and member
          links. Members with no other space will need to set up a new one. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className='space-y-2'>
        <label className='text-sm font-medium' htmlFor='space-delete-confirmation'>
          Type <span className='font-semibold'>{space.name}</span> to confirm.
        </label>
        <Input
          autoComplete='off'
          id='space-delete-confirmation'
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={isPending || confirmation.trim() !== space.name}
          variant='destructive'
          onClick={(event) => {
            event.preventDefault();
            handleDelete();
          }}
        >
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Delete space'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
