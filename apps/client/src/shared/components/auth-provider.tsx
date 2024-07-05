import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/clerk-react';

import { InitLaoder } from '@/shared/components/ui/loaders/init-laoder';
import { env } from '@/shared/env';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <ClerkProvider publishableKey={env.AuthPublishableKey}>
      <ClerkLoading>
        <InitLaoder />
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
};
