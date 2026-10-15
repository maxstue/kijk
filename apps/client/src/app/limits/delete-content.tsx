import { deleteLimitMutationOptions } from '@kijk/api/limits/options';
import type { Limit } from '@kijk/api/limits/types';
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
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';

/** Confirmation dialog content for deleting a consumption limit. */
export function LimitDeleteContent({ limit, onClose }: { limit: Limit; onClose: () => void }) {
  const spaceId = useSpaceId();
  const { isPending, mutate } = useMutation(deleteLimitMutationOptions(spaceId));

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {limit.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes the limit and its warnings. Your resource and recorded consumption will be kept.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={isPending}
          variant='destructive'
          onClick={(event) => {
            event.preventDefault();
            mutate(limit.id, {
              onError(error) {
                toast.error(error.name, { description: error.message });
              },
              onSuccess() {
                toast.success(`Successfully deleted: ${limit.name}`);
                onClose();
              },
            });
          }}
        >
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Delete'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
