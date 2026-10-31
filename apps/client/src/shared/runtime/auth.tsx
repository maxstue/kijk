import { createContext, useContext } from 'react';

/** Identity needed by client routing; upstream credentials never belong to this contract. */
export interface AppSession {
  id: string;
  userId: string;
}

/** Platform-specific session lookup used by the shared route tree. */
export interface AuthGateway {
  getSession: () => Promise<AppSession | null>;
}

/** Authentication actions exposed to features independently of Clerk or a desktop runtime. */
export interface AppAuth {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  signOut: () => Promise<void>;
  identity?: { externalProviders: readonly string[]; passwordEnabled: boolean };
}

/** Injected by the platform entry point; features never instantiate an authentication SDK. */
export const AppAuthContext = createContext<AppAuth | null>(null);

/** Returns the authentication state of the current application instance. */
export function useAppAuth() {
  const auth = useContext(AppAuthContext);
  if (!auth) {
    throw new Error('AppAuthContext is missing.');
  }
  return auth;
}
