import { currentUserQueryOptions } from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { WelcomeFlow } from '@/app/welcome/welcome-flow';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

/** `/welcome`: onboarding flow. */
export const Route = createFileRoute('/_authenticated/_onboarding/welcome')({
  loader: ({ context: { queryClient } }) => queryClient.query({ ...currentUserQueryOptions(), staleTime: 'static' }),
  component: WelcomePage,
  pendingComponent: InitLoader,
});

function WelcomePage() {
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const navigate = useNavigate({ from: '/welcome' });
  const identity = currentUser?.identity ?? emptyIdentity;

  return (
    <>
      <title>Welcome | Kijk</title>
      <WelcomeFlow
        email={identity.email}
        fullName={identity.fullName}
        spaceName={undefined}
        imageUrl={identity.imageUrl}
        initialDisplayName={identity.fullName ?? ''}
        onComplete={() => navigate({ replace: true, to: '/home' })}
      />
    </>
  );
}

const emptyIdentity = {
  email: null,
  fullName: null,
  imageUrl: null,
};
