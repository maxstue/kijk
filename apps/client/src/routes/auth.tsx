import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Undo2 } from 'lucide-react';
import { z } from 'zod';

import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { Head } from '@/shared/components/head';
import { buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/helpers';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search, context: { authClient } }) => {
    const session = authClient.getInstance()?.session;

    if (!session?.getToken()) {
      return;
    }

    throw redirect({ to: search.from ?? '/' });
  },
  component: AuthPage,
});

function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');

  return (
    <>
      <Head title={show} />
      <div className='m-6 flex flex-col'>
        <div>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href='https://kijk-ruby.vercel.app/'
            rel='noopener noreferrer'
          >
            <Undo2 className='h-4 w-4' />
            To website
          </a>
        </div>
        {show === 'Sign Up' && <SignUp goto={setShow} />}
        {show === 'Login' && <Login goto={setShow} />}
      </div>
    </>
  );
}
