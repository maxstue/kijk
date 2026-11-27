import { queryKeys } from '@kijk/api/query-keys';
import * as usersOptions from '@kijk/api/users/options';
import type { ReceivedInvitation } from '@kijk/api/users/types';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useIsMutating, useMutation, useQuery } from '@tanstack/react-query';
import { ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

import { AppBrand } from '@/shared/components/app-brand';

import { membershipPrivacyNote } from './constants';
import { invitationErrorMessage } from './helpers';

interface Props {
  /** Opens the space after the user joined it. */
  onJoined: (spaceId: string) => void;
  /** Opens the personal space; the invitations stay in the inbox. */
  onLater: () => void;
}

/** Shown once after onboarding when invitations are waiting: who invited the user where, before the app starts. */
export function InvitationWelcome({ onJoined, onLater }: Props) {
  // Loaded before the screen opens; a failed answer refreshes it and removes invitations that are gone.
  const { data: invitations = [] } = useQuery(usersOptions.invitationsQueryOptions());
  const answering = useIsMutating({ mutationKey: queryKeys.users.invitations }) > 0;

  return (
    <main className='mx-auto flex min-h-full w-full max-w-xl flex-col justify-center gap-5 px-4 py-8'>
      <AppBrand className='justify-center' logoClassName='size-8' nameClassName='text-xl' />
      <h1 className='text-center text-2xl font-semibold tracking-tight'>
        {invitations.length === 0
          ? 'Your invitations are no longer available'
          : invitations.length === 1
            ? 'You have an invitation'
            : 'You have invitations'}
      </h1>
      <ul aria-label='Invitations' className='space-y-3'>
        {invitations.map((invitation) => (
          <WelcomeInvitation key={invitation.id} disabled={answering} invitation={invitation} onJoined={onJoined} />
        ))}
      </ul>
      <p className='text-muted-foreground flex gap-2 text-sm'>
        <ShieldCheckIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
        {membershipPrivacyNote}
      </p>
      {invitations.length === 0 ? (
        <Button className='self-center' onClick={onLater}>
          Continue
        </Button>
      ) : (
        <>
          <Button className='self-center' disabled={answering} variant='ghost' onClick={onLater}>
            Later
          </Button>
          <p className='text-muted-foreground text-center text-xs'>
            Your invitations stay in the inbox until they expire.
          </p>
        </>
      )}
    </main>
  );
}

interface WelcomeInvitationProps {
  disabled: boolean;
  invitation: ReceivedInvitation;
  onJoined: (spaceId: string) => void;
}

function WelcomeInvitation({ disabled, invitation, onJoined }: WelcomeInvitationProps) {
  const { mutate } = useMutation(usersOptions.acceptInvitationMutationOptions());

  function join() {
    mutate(invitation.id, {
      onError: (error) => toast.error(invitationErrorMessage(error)),
      onSuccess: ({ spaceId }) => onJoined(spaceId),
    });
  }

  return (
    <li>
      <Card>
        <CardHeader>
          <CardTitle>
            {invitation.invitedByName} invited you to “{invitation.spaceName}”
          </CardTitle>
          <CardDescription>You join as {invitation.roleName}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button aria-label={`Join ${invitation.spaceName}`} disabled={disabled} onClick={join}>
            Join
          </Button>
        </CardContent>
      </Card>
    </li>
  );
}
