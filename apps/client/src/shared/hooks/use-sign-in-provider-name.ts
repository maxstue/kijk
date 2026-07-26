import { useUser } from '@clerk/react';

import { getSignInProviderName } from '@/shared/types/auth';

export function useSignInProviderName() {
  const { user } = useUser();

  return getSignInProviderName(user?.externalAccounts.map((externalAccount) => externalAccount.provider) ?? []);
}
