import { KindeProvider } from '@kinde-oss/kinde-auth-react';

import { env } from '@/env';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <KindeProvider
      clientId={env.AuthClientId}
      domain={env.AuthDomain}
      audience={env.AuthAudience}
      logoutUri={window.location.origin}
      redirectUri={window.location.origin}
      isDangerouslyUseLocalStorage={process.env.NODE_ENV === 'development'}
    >
      {children}
    </KindeProvider>
  );
};
