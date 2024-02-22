import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { Head } from '@/shared/components/head';
import { supabase } from '@/shared/lib/supabase-client';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ navigate, search }) => {
    const session = await supabase.auth.getSession();

    if (!session.data.session?.access_token) {
      return null;
    }

    return navigate({ to: search?.from ?? '/home' });
  },
  component: AuthPage,
});

function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');

  // TODO add back button to navigate to the "web"-app
  return (
    <>
      <Head title={show} />
      {show === 'Sign Up' && <SignUp goto={setShow} />}
      {show === 'Login' && <Login goto={setShow} />}
    </>
  );
}
