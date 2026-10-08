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

import { useDeleteCategory } from '@/app/categories/use-mutations';
import type { Category } from '@/shared/api/categories/types';

interface Props {
  category: Category;
  onClose: () => void;
}

/** Confirmation dialog content for deleting a custom category. */
export function CategoryDeleteContent({ category, onClose }: Props) {
  const { isPending, mutate } = useDeleteCategory();

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
