import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { WelcomeFlow } from '@/app/welcome/welcome-flow';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_authenticated/_onboarding/welcome')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(currentUserQueryOptions()),
  component: WelcomePage,
  pendingComponent: InitLoader,
});

function WelcomePage() {
  useSetSiteHeader('Welcome');
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const navigate = useNavigate({ from: '/welcome' });
  const identity = currentUser?.identity ?? emptyIdentity;

  return (
    <WelcomeFlow
      email={identity.email}
      fullName={identity.fullName}
      householdName={undefined}
      imageUrl={identity.imageUrl}
      initialDisplayName={identity.fullName ?? ''}
      onComplete={() => navigate({ replace: true, to: '/home' })}
    />
  );
}

const emptyIdentity = {
  email: null,
  fullName: null,
  imageUrl: null,
};
