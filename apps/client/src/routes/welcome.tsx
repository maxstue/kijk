import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';

import { WelcomeFlow } from '@/app/welcome/welcome-flow';
import { currentUserQueryOptions, signedInUserQueryOptions } from '@/shared/api/users/options';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { useSignInProviderName } from '@/shared/hooks/use-sign-in-provider-name';
import { stringIsNotEmptyOrWhitespace } from '@/shared/utils/string';

export const Route = createFileRoute('/welcome')({
  beforeLoad: async ({ context: { authClient, queryClient } }) => {
    const sessionToken = await authClient?.session?.getToken();
    if (!stringIsNotEmptyOrWhitespace(sessionToken)) {
      throw redirect({ search: { from: location.href }, to: '/auth' });
    }

    const user = await queryClient.ensureQueryData(signedInUserQueryOptions());
    if (user.firstTime === false) {
      throw redirect({ replace: true, to: '/home' });
    }
  },
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(currentUserQueryOptions()),
  component: WelcomePage,
  pendingComponent: InitLoader,
});

function WelcomePage() {
  useSetSiteHeader('Welcome');
  const { accountName: signInAccount, providerName: authProvider } = useSignInProviderName();
  const { data: currentUser } = useSuspenseQuery(currentUserQueryOptions());
  const navigate = useNavigate({ from: '/welcome' });
  const activeHousehold = currentUser.households?.find((household) => household.isActive);
  const externalIdentity = currentUser.externalIdentity;

  return (
    <WelcomeFlow
      authProvider={authProvider}
      email={externalIdentity?.email}
      fullName={externalIdentity?.fullName}
      householdName={activeHousehold?.name ?? 'My household'}
      imageUrl={externalIdentity?.imageUrl}
      initialDisplayName=''
      onComplete={() => navigate({ replace: true, to: '/home' })}
      signInAccount={signInAccount}
    />
  );
}
