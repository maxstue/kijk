import { useClerk } from '@clerk/react';
import { RouterProvider as TRouterProvider } from '@tanstack/react-router';

import { router } from '@/router';

/** Renders the router with the Clerk client in the route context. */
export default function RouterProvider() {
  const clerk = useClerk();
  return <TRouterProvider context={{ authClient: clerk }} router={router} />;
}
