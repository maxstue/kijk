import * as usersOptions from '@kijk/api/users/options';
import { isReadyCurrentUser } from '@kijk/api/users/types';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import { AuthError, AuthPending } from '@/app/auth/feedback';
import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { AppBrand } from '@/shared/components/app-brand';
import { safeRedirect } from '@/shared/lib/safe-redirect';
import { getStartSpace } from '@/shared/lib/spaces';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

/** Completes sign-in only after the session and Kijk account have both been loaded. */
export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  ssr: false,
  component: AuthPage,
  pendingComponent: AuthPending,
  pendingMs: 50,
  errorComponent: AuthError,
  beforeLoad: async ({ search, context: { auth, queryClient } }) => {
    const session = await auth.getSession();

    if (!session) {
      return;
    }

    const currentUser = await queryClient.query({ ...usersOptions.meQueryOptions(), staleTime: 0, retry: false });
    if (!isReadyCurrentUser(currentUser)) {
      throw redirect({ to: '/welcome', replace: true });
    }
    const target = safeRedirect(search.from);
    const path = target.split(/[?#]/)[0];
    if (target !== '/' && path !== '/auth' && path !== '/sso-callback') {
      throw redirect({ to: target, replace: true });
    }
    const space = getStartSpace(currentUser.user);
    if (space) {
      throw redirect({ to: '/$spaceId', params: { spaceId: space.id }, replace: true });
    }
    throw redirect({ to: '/welcome', replace: true });
  },
});

function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');
  const search = Route.useSearch();
  const from = safeRedirect(search.from);

  return (
    <main className='bg-background flex min-h-svh flex-1 flex-col items-center justify-center gap-6 p-6'>
      <title>{show} | Kijk</title>
      <div className='flex w-full max-w-sm flex-col items-center gap-6'>
        <AppBrand />
        <div className='w-full'>
          {show === 'Sign Up' && <SignUp goto={setShow} redirectTo={from} />}
          {show === 'Login' && <Login goto={setShow} redirectTo={from} />}
        </div>
      </div>
    </main>
  );
}
