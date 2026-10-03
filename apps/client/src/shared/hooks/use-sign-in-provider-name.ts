import { useUser } from '@clerk/react';

import { getSignInProviderName } from '@/shared/types/auth';

/** Returns `providerName`: the provider the current user signed in with, e.g. "Google" or "Email". */
export function useSignInProviderName() {
  const { user } = useUser();

  const providerName = getSignInProviderName(
    user?.externalAccounts.map((externalAccount) => externalAccount.provider) ?? [],
  );

  return {
    providerName,
  };
}
