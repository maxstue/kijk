import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { AppBrand } from '@/shared/components/app-brand';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  component: AuthPage,
  beforeLoad: async ({ search, context: { authClient } }) => {
    const session = authClient?.session;

    if (!(await session?.getToken())) {
      return;
    }

    throw redirect({ to: search.from ?? '/' });
  },
});

function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');
  const { from = '/' } = Route.useSearch();
  useSetSiteHeader(show);

  return (
    <div className='bg-muted flex h-full flex-col gap-6 p-6'>
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
