import { useClerk } from '@clerk/clerk-react';
import { RouterProvider as TRouterProvider } from '@tanstack/react-router';
import { router } from '@/router';

export default function RouterProvider() {
  const clerk = useClerk();
  return <TRouterProvider context={{ authClient: clerk }} router={router} />;
}
