import * as spacesOptions from '@kijk/api/spaces/options';
import type { SpaceInvitation } from '@kijk/api/spaces/types';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { formatDateTime } from '@/shared/utils/format';

interface Props {
  spaceId: string;
}

/** Pending invitations of a space with their role, inviter and expiry; each one can be revoked. */
export function PendingInvitations({ spaceId }: Props) {
  const { data: invitations, isPending, isError, refetch } = useQuery(spacesOptions.invitationsQueryOptions(spaceId));

  return (
    <section aria-labelledby='pending-invitations' className='space-y-3'>
      <div>
        <h3 className='font-medium' id='pending-invitations'>
          Pending invitations
        </h3>
        <p className='text-muted-foreground text-sm'>Invitations expire after 7 days.</p>
      </div>
      {isPending ? (
        <Skeleton className='h-16 w-full' />
      ) : isError ? (
        <Card>
          <CardContent className='flex flex-wrap items-center justify-between gap-4'>
            <p className='text-sm'>The invitations could not be loaded.</p>
            <Button size='sm' variant='outline' onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : invitations.length === 0 ? (
        <p className='text-muted-foreground text-sm'>No pending invitations.</p>
      ) : (
        <Card className='gap-0 py-0'>
          <ul>
            {invitations.map((invitation) => (
              <InvitationRow key={invitation.id} spaceId={spaceId} invitation={invitation} />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

interface InvitationRowProps {
  spaceId: string;
  invitation: SpaceInvitation;
}

function InvitationRow({ spaceId, invitation }: InvitationRowProps) {
  const { mutate, isPending } = useMutation(spacesOptions.revokeInvitationMutationOptions());

  function revoke() {
    mutate(
      { spaceId, invitationId: invitation.id },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => toast.success(`Invitation for ${invitation.inviteeLabel} revoked`),
      },
    );
  }

  return (
    <li className='flex flex-wrap items-center justify-between gap-4 border-b px-(--card-spacing) py-4 last:border-b-0'>
      <div className='min-w-0 space-y-0.5'>
        <div className='font-medium break-all'>{invitation.inviteeLabel}</div>
        <p className='text-muted-foreground text-sm'>
          {invitation.roleName} · invited by {invitation.createdByName} · expires {formatDateTime(invitation.expiresAt)}
        </p>
      </div>
      <Button
        aria-label={`Revoke invitation for ${invitation.inviteeLabel}`}
        disabled={isPending}
        size='sm'
        variant='outline'
        onClick={revoke}
      >
        Revoke
      </Button>
    </li>
  );
}
