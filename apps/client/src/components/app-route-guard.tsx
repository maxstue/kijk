import { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth-store';

export const AppRouteGuard = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const params = new URLSearchParams();
    params.set('from', location.pathname);
    return <Navigate to={`/auth?${params.toString()}`} replace />;
  }

  return children;
};
