import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/classnames';
import { buttonVariants } from '@/components/ui/button';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';

export function LandingnNavActions() {
  return (
    <div className='flex space-x-3'>
      <nav className='flex items-center space-x-1'>
        <ThemeModeToggle />
      </nav>
      <Link href='/login' className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'px-4')}>
        Login
      </Link>
    </div>
  );
}
