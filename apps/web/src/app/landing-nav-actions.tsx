import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/button';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';

import { env } from '../env.mjs';

export function LandingnNavActions() {
  return (
    <div className='flex space-x-3'>
      <nav className='flex items-center space-x-1'>
        <ThemeModeToggle />
      </nav>
      <Link
        href={env.NEXT_PUBLIC_CLIENT_URL}
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm' }),
          'px-4 hover:bg-muted-foreground hover:text-white',
        )}
      >
        Login
      </Link>
    </div>
  );
}
