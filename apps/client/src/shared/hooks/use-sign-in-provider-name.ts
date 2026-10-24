import { useAppAuth } from '@/shared/runtime/auth';
import { getSignInProviderName } from '@/shared/types/auth';

/** Returns `providerName`: the provider the current user signed in with, e.g. "Google" or "Email". */
export function useSignInProviderName() {
  const { identity } = useAppAuth();

  const providerName = getSignInProviderName(identity?.externalProviders ?? []);

  return {
    providerName,
  };
}
