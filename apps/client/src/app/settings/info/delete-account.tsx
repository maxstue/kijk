import { useAuth } from '@clerk/react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { requestAccountDeletionMutationOptions } from '@/shared/api/users/options';

const confirmationWord = 'DELETE';

/**
 * Deletes the user's account and all their data after a typed confirmation. The deletion runs in the background; the
 * user is signed out right away.
 */
export function DeleteAccount() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const confirmationId = useId();
  const deleteMutation = useMutation({
    ...requestAccountDeletionMutationOptions(),
    onError: (error) => toast.error(error.name, { description: error.message }),
    onSuccess: async () => {
      toast.success('Your account is being deleted');
      queryClient.clear();
      await signOut();
      await navigate({ replace: true, to: '/' });
    },
  });

  return (
    <section className='border-destructive/50 space-y-4 rounded-lg border p-5'>
      <div className='space-y-1'>
        <h3 className='text-destructive font-medium'>Delete my account and all my data</h3>
        <p className='text-muted-foreground text-sm'>
          Deletes your personal space, spaces you are the only member of, your private accounts, transactions, budgets
          and rules, and your sign-in. Shared data in spaces with other members stays there for them. This cannot be
          undone; export what you want to keep first.
        </p>
      </div>
      <AlertDialog onOpenChange={() => setConfirmation('')}>
        <AlertDialogTrigger asChild>
          <Button variant='destructive'>Delete my account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything that belongs only to you is deleted permanently, and you are signed out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor={confirmationId}>
              Type <span className='font-semibold'>{confirmationWord}</span> to confirm
            </Label>
            <Input
              autoComplete='off'
              id={confirmationId}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              disabled={confirmation !== confirmationWord || deleteMutation.isPending}
              variant='destructive'
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Delete everything'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
