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

import { useDeleteResource } from '@/app/resources/use-delete-resource';
import type { Resource } from '@/shared/types/domain';

interface Props {
  onClose: () => void;
  resourceType: Resource;
}

export function ResourceTypeDeleteContent({ onClose, resourceType }: Props) {
  const { isPending, mutate } = useDeleteResource();

  const handleDelete = () => {
    mutate(
      { id: resourceType.id },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success(`Successfully deleted: ${resourceType.name}`);
          onClose();
        },
      },
    );
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          Only unused resource types can be deleted. Existing consumptions and limits are never deleted automatically.
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
