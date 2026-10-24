import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { AppBrand } from '@/shared/components/app-brand';
import { safeRedirect } from '@/shared/lib/safe-redirect';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

/** `/auth`: sign-in and sign-up; signed-in users are sent to `from` or `/`. */
export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  ssr: false,
  component: AuthPage,
  beforeLoad: async ({ search, context: { auth } }) => {
    const session = await auth.getSession();

    if (!session) {
      return;
    }

    throw redirect({ to: safeRedirect(search.from) });
  },
});

function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');
  const search = Route.useSearch();
  const from = safeRedirect(search.from);

  return (
    <div className='bg-muted flex h-full flex-col gap-6 p-6'>
      <title>{show} | Kijk</title>
      <div className='flex h-full w-full flex-col items-center justify-center gap-6'>
        <AppBrand />
        <div className='flex'>
          {show === 'Sign Up' && <SignUp goto={setShow} redirectTo={from} />}
          {show === 'Login' && <Login goto={setShow} redirectTo={from} />}
        </div>
      </div>
    </div>
  );
}
