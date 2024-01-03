// import { PropsWithChildren } from 'react';

// import { useAuthStore } from '@/stores/auth-store';
// import { Navigate } from '@tanstack/react-router';

// export const AppRouteGuard = ({ children }: PropsWithChildren) => {
//   const { isAuthenticated } = useAuthStore();
//   const location = use();

//   if (!isAuthenticated) {
//     const params = new URLSearchParams();
//     params.set('from', location.pathname);
//     return <Navigate to={`/auth?${params.toString()}`} replace />;
//   }

//   return children;
// };

// TODO: add route guard
