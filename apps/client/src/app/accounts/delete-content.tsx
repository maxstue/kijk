import { deleteAccountMutationOptions } from '@kijk/api/accounts/options';
import type { Account } from '@kijk/api/accounts/types';
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
  account: Account;
  onClose: () => void;
}

/** Confirmation dialog content for deleting an account. */
export function AccountDeleteContent({ account, onClose }: Props) {
  const spaceId = useSpaceId();
  const { isPending, mutate } = useMutation(deleteAccountMutationOptions(spaceId));

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
