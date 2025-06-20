import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Undo2 } from 'lucide-react';
import { z } from 'zod';

import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/helpers';
import { Icons } from '@/shared/components/icons';
import { siteConfig } from '@/shared/lib/constants';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

const authSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute('/auth')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search, context: { authClient } }) => {
    const session = authClient?.session;

    if (!session?.getToken()) {
      return;
    }

    throw redirect({ to: search.from ?? '/' });
  },
  component: AuthPage,
});

function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');
  useSetSiteHeader(show);

  return (
    <>
      <div className='bg-muted flex h-full flex-col gap-6 p-6'>
        <div>
          <a
            className={cn(buttonVariants({ variant: 'ghost' }), 'group gap-2')}
            href={siteConfig.url}
            rel='noopener noreferrer'
          >
            <Undo2 className='h-4 w-4' />
            To website
          </a>
        </div>
        <div className='flex h-full w-full flex-col items-center justify-center gap-6'>
          <div className='flex items-center gap-2 text-center'>
            <Icons.logo className='text-primary size-10' />
            <div className='truncate text-2xl font-bold'>{siteConfig.name}</div>
          </div>
          <div className='flex'>
            {show === 'Sign Up' && <SignUp goto={setShow} />}
            {show === 'Login' && <Login goto={setShow} />}
          </div>
        </div>
      </div>
    </>
  );
}
