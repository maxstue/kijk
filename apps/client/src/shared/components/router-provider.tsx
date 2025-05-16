import { router } from '@/router';
import { useClerk } from '@clerk/clerk-react';
import { RouterProvider as TRouterProvider } from '@tanstack/react-router';

export default function RouterProvider() {
  const clerk = useClerk();
  return <TRouterProvider router={router} context={{ authClient: clerk }} />;
}
