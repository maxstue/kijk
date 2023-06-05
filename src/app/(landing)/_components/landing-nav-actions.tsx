import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/classnames';
import { getCurrentUser } from '@/lib/session';
import { Icons } from '@/components/icons';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';
import { buttonVariants } from '@/components/ui/button';

export async function LandingnNavActions() {
  const user = await getCurrentUser();

  return (
    <div className='flex space-x-3'>
      <nav className='flex items-center space-x-1'>
        <ThemeModeToggle />
      </nav>
      {user ? (
        <Link
          href='/dashboard'
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm' }),
            'flex gap-1 px-4 hover:bg-muted-foreground hover:text-white'
          )}
        >
          To Dashboard
          <Icons.arrowRight className='h-4 w-4' />
        </Link>
      ) : (
        <Link
          href='/login'
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm' }),
            'px-4 hover:bg-muted-foreground hover:text-white'
          )}
        >
          Login
        </Link>
      )}
    </div>
  );
}
