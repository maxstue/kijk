import { ClerkProvider, useAuth, useUser } from '@clerk/tanstack-react-start';
import type { ReactNode } from 'react';

import { config } from '@/shared/config';
import { AppAuthContext } from '@/shared/runtime/auth';

interface WebAuthProviderProps {
  children: ReactNode;
}

/** Web-only Clerk integration. Public children render while the browser SDK loads. */
export function WebAuthProvider({ children }: WebAuthProviderProps) {
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

interface AuthBridgeProps {
  children: ReactNode;
}

function AuthBridge({ children }: AuthBridgeProps) {
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
