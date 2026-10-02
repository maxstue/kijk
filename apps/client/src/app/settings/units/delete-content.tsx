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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/api/query-keys';
import { deleteUnitMutationOptions } from '@/shared/api/units/options';
import type { Unit } from '@/shared/api/units/types';

/** Confirmation dialog content for deleting a unit. */
export function UnitDeleteContent({ onClose, unit }: { onClose: () => void; unit: Unit }) {
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation(deleteUnitMutationOptions());

  function handleDelete() {
    mutate(unit.id, {
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
        toast.success(`Successfully deleted: ${unit.name}`);
        onClose();
      },
    });
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          Only units that are not shared with a household or used by resources can be deleted.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={isPending}
          variant='destructive'
          onClick={(event) => {
            event.preventDefault();
            handleDelete();
          }}
        >
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
