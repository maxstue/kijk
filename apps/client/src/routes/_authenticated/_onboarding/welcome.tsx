import * as usersOptions from '@kijk/api/users/options';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { InvitationWelcome } from '@/app/inbox/invitation-welcome';
import { WelcomeFlow } from '@/app/welcome/welcome-flow';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

/** `/welcome`: onboarding flow, followed by the waiting invitations if there are any. */
export const Route = createFileRoute('/_authenticated/_onboarding/welcome')({
  loader: ({ context: { queryClient } }) =>
    queryClient.query({ ...usersOptions.meQueryOptions(), staleTime: 'static' }),
  component: WelcomePage,
  pendingComponent: InitLoader,
});

function WelcomePage() {
  const { data: currentUser } = useQuery(usersOptions.meQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: '/welcome' });
  // Only for this visit: a reload after onboarding opens the app, and the invitations wait in the inbox.
  const [showInvitations, setShowInvitations] = useState(false);
  const identity = currentUser?.identity ?? emptyIdentity;

  // Onboarding linked the invitations to the new account; returns whether any are waiting.
  async function openInvitations() {
    const invitations = await queryClient
      .query({ ...usersOptions.invitationsQueryOptions(), staleTime: 0 })
      .catch(() => []);
    setShowInvitations(invitations.length > 0);
    return invitations.length > 0;
  }

  if (showInvitations) {
    return (
      <>
        <title>Invitations | Kijk</title>
        <InvitationWelcome
          onJoined={(spaceId) => void navigate({ params: { spaceId }, replace: true, to: '/$spaceId' })}
          onLater={() => void navigate({ replace: true, to: '/' })}
        />
      </>
    );
  }

  return (
    <>
      <title>Welcome | Kijk</title>
      <WelcomeFlow
        email={identity.email}
        fullName={identity.fullName}
        imageUrl={identity.imageUrl}
        initialDisplayName={identity.fullName ?? ''}
        onComplete={async () => {
          if (!(await openInvitations())) {
            await navigate({ replace: true, to: '/' });
          }
        }}
      />
    </>
  );
}

const emptyIdentity = {
  email: null,
  fullName: null,
  imageUrl: null,
};
