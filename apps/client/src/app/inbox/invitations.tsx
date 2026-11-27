import { queryKeys } from '@kijk/api/query-keys';
import * as usersOptions from '@kijk/api/users/options';
import type { ReceivedInvitation } from '@kijk/api/users/types';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import { useIsMutating, useMutation, useQuery } from '@tanstack/react-query';
import { InboxIcon } from 'lucide-react';
import { toast } from 'sonner';

import { formatDateTime } from '@/shared/utils/format';

import { invitationErrorMessage } from './helpers';

interface Props {
  /** The address the user is signed in with; invitations by e-mail only reach this address. */
  email?: string | null;
  /** Opens the space after the user joined it. */
  onJoined: (spaceId: string) => void;
}

/** The current user's pending invitations to shared spaces; each one can be accepted or declined. */
export function InboxInvitations({ email, onJoined }: Props) {
  const { data: invitations, isPending, isError, refetch } = useQuery(usersOptions.invitationsQueryOptions());

  if (isPending) {
    return <Skeleton className='h-20 w-full' />;
  }
  if (isError) {
    return (
      <Card>
        <CardContent className='flex flex-wrap items-center justify-between gap-4'>
          <p className='text-sm'>Your invitations could not be loaded.</p>
          <Button size='sm' variant='outline' onClick={() => void refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center gap-2 py-6 text-center'>
          <InboxIcon aria-hidden className='text-muted-foreground size-8' />
          <p className='font-medium'>No invitations</p>
          <p className='text-muted-foreground max-w-md text-sm'>
            {email ? (
              <>
                You are signed in as <span className='text-foreground font-medium break-all'>{email}</span>. Invitations
                by e-mail only reach this address; others can also invite you by your unique name.
              </>
            ) : (
              'Others can invite you by your unique name or by the e-mail address you sign in with.'
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='gap-0 py-0'>
      <ul aria-label='Invitations'>
        {invitations.map((invitation) => (
          <InvitationRow key={invitation.id} invitation={invitation} onJoined={onJoined} />
        ))}
      </ul>
    </Card>
  );
}

interface InvitationRowProps {
  invitation: ReceivedInvitation;
  onJoined: (spaceId: string) => void;
}

function InvitationRow({ invitation, onJoined }: InvitationRowProps) {
  const accept = useMutation(usersOptions.acceptInvitationMutationOptions());
  const decline = useMutation(usersOptions.declineInvitationMutationOptions());
  // Answering one invitation refreshes the whole inbox; the other rows wait until it settled.
  const answering = useIsMutating({ mutationKey: queryKeys.users.invitations }) > 0;

  function join() {
    accept.mutate(invitation.id, {
      onError: (error) => toast.error(invitationErrorMessage(error)),
      onSuccess: ({ spaceId }) => {
        toast.success(`You joined ${invitation.spaceName}`);
        onJoined(spaceId);
      },
    });
  }

  function reject() {
    decline.mutate(invitation.id, {
      onError: (error) => toast.error(invitationErrorMessage(error)),
      onSuccess: () => toast.success(`Invitation to ${invitation.spaceName} declined`),
    });
  }

  return (
    <li className='flex flex-wrap items-center justify-between gap-4 border-b px-(--card-spacing) py-4 last:border-b-0'>
      <div className='min-w-0 space-y-0.5'>
        <div className='font-medium break-words'>{invitation.spaceName}</div>
        <p className='text-muted-foreground text-sm'>
          {invitation.invitedByName} invited you as {invitation.roleName} · expires{' '}
          {formatDateTime(invitation.expiresAt)}
        </p>
      </div>
      <div className='flex gap-2'>
        <Button
          aria-label={`Decline invitation to ${invitation.spaceName}`}
          disabled={answering}
          size='sm'
          variant='outline'
          onClick={reject}
        >
          Decline
        </Button>
        <Button aria-label={`Join ${invitation.spaceName}`} disabled={answering} size='sm' onClick={join}>
          Join
        </Button>
      </div>
    </li>
  );
}
