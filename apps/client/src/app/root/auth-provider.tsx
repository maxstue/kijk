import { ClerkProvider, useAuth, useUser } from '@clerk/tanstack-react-start';
import type { ReactNode } from 'react';

import { config } from '@/shared/config';
import { AppAuthContext } from '@/shared/runtime/auth';

/** Web-only Clerk integration. Public children render while the browser SDK loads. */
export function WebAuthProvider({ children }: { children: ReactNode }) {
  if (!config.AuthPublishableKey) {
    return (
      <AppAuthContext value={{ isLoaded: true, isSignedIn: false, signOut: async () => {} }}>{children}</AppAuthContext>
    );
  }
  return (
    <ClerkProvider afterSignOutUrl='/' publishableKey={config.AuthPublishableKey}>
      <AuthBridge>{children}</AuthBridge>
    </ClerkProvider>
  );
}

function AuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  return (
    <AppAuthContext
      value={{
        isLoaded,
        isSignedIn,
        identity: user
          ? {
              externalProviders: user.externalAccounts.map((account) => account.provider),
              passwordEnabled: user.passwordEnabled,
            }
          : undefined,
        signOut: async () => {
          await signOut();
        },
      }}
    >
      {children}
    </AppAuthContext>
  );
}
