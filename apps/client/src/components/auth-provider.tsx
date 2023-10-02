import { KindeProvider } from '@kinde-oss/kinde-auth-react';

interface Props {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  return (
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID as string}
      domain={import.meta.env.VITE_KINDE_DOMAIN as string}
      audience={import.meta.env.VITE_KINDE_AUDIENCE as string}
      logoutUri={window.location.origin}
      redirectUri={window.location.origin}
      isDangerouslyUseLocalStorage={process.env.NODE_ENV === 'development'}
    >
      {children}
    </KindeProvider>
  );
};
