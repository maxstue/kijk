import { ClerkProvider } from '@clerk/clerk-react';

import { env } from '@/shared/env';
import { authClient } from '@/shared/lib/auth-client';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <ClerkProvider Clerk={authClient} publishableKey={env.AuthPublishableKey}>
      {children}
    </ClerkProvider>
  );
};
