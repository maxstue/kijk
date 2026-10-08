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

import { useDeleteAccount } from '@/app/accounts/use-mutations';
import type { Account } from '@/shared/api/accounts/types';

interface Props {
  account: Account;
  onClose: () => void;
}

/** Confirmation dialog content for deleting an account. */
export function AccountDeleteContent({ account, onClose }: Props) {
  const { isPending, mutate } = useDeleteAccount();

  const handleDelete = () => {
    mutate(account.id, {
      onError(error) {
        toast.error(error.name, { description: error.message });
      },
      onSuccess() {
        toast.success(`Successfully deleted: ${account.name}`);
        onClose();
      },
    });
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {account.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          Only accounts without transactions can be deleted. Transactions are never deleted automatically.
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
