import { useUser } from '@clerk/react';

import { getSignInProviderName } from '@/shared/types/auth';

export function useSignInProviderName() {
  const { user } = useUser();

  const providerName = getSignInProviderName(
    user?.externalAccounts.map((externalAccount) => externalAccount.provider) ?? [],
  );

  return {
    providerName,
  };
}
