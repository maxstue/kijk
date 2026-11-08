import * as accountsOptions from '@kijk/api/accounts/options';
import type { Account } from '@kijk/api/accounts/types';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmation } from '@/shared/components/delete-confirmation';
import { useSpaceId } from '@/shared/hooks/use-active-space';

interface Props {
  account: Account;
  onClose: () => void;
}

/** Confirmation dialog content for deleting an account. */
export function AccountDeleteContent({ account, onClose }: Props) {
  const spaceId = useSpaceId();
  const { isPending, mutate } = useMutation(accountsOptions.deleteMutationOptions(spaceId));

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
    <DeleteConfirmation
      title={`Delete ${account.name}?`}
      description='Only accounts without transactions can be deleted. Transactions are never deleted automatically.'
      isPending={isPending}
      onConfirm={handleDelete}
    />
  );
}
