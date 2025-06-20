import { ClerkProvider, useAuth } from '@clerk/clerk-react';

import { env } from '@/shared/env';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <ClerkProvider afterSignOutUrl='/' publishableKey={env.AuthPublishableKey}>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </ClerkProvider>
  );
};

function InnerAuthProvider({ children }: Props) {
  const { isLoaded } = useAuth();
  return isLoaded ? children : <InitLoader />;
}
