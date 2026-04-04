import { ClerkProvider, useAuth } from '@clerk/react';

import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { config } from '@/shared/config';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <ClerkProvider afterSignOutUrl='/' publishableKey={config.AuthPublishableKey}>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </ClerkProvider>
  );
};

function InnerAuthProvider({ children }: Props) {
  const { isLoaded } = useAuth();
  return isLoaded ? children : <InitLoader />;
}
