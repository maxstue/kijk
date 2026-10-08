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
import { toast } from 'sonner';

import { useDeleteLimit } from '@/app/limits/use-delete-limit';
import type { Limit } from '@/shared/api/limits/types';

/** Confirmation dialog content for deleting a consumption limit. */
export function LimitDeleteContent({ limit, onClose }: { limit: Limit; onClose: () => void }) {
  const { isPending, mutate } = useDeleteLimit();

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
