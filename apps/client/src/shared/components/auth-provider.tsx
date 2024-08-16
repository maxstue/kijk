import { ClerkLoaded, ClerkLoading, ClerkProvider } from '@clerk/clerk-react';

import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { env } from '@/shared/env';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <ClerkProvider publishableKey={env.AuthPublishableKey}>
      <ClerkLoading>
        <InitLoader />
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
};
