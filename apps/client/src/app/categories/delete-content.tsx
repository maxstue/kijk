import * as categoriesOptions from '@kijk/api/categories/options';
import type { Category } from '@kijk/api/categories/types';
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

interface Props {
  category: Category;
  onClose: () => void;
}

/** Confirmation dialog content for deleting a custom category. */
export function CategoryDeleteContent({ category, onClose }: Props) {
  const spaceId = useSpaceId();
  const { isPending, mutate } = useMutation(categoriesOptions.deleteMutationOptions(spaceId));

  const handleDelete = () => {
    mutate(category.id, {
      onError(error) {
        toast.error(error.name, { description: error.message });
      },
      onSuccess() {
        toast.success(`Successfully deleted: ${category.name}`);
        onClose();
      },
    });
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          Only unused categories can be deleted. Transactions and budgets are never deleted automatically.
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
