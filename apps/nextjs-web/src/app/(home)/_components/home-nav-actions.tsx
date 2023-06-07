import React from 'react';
import { redirect } from 'next/navigation';

import { UserNav } from '@/app/(home)/_components/user-nav';
import { authOptions } from '@/lib/auth';
import { getCurrentUser } from '@/lib/session';
import { CommandMenu } from '@/components/command-menu';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';

export async function HomeNavActions() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(authOptions?.pages?.signIn || '/login');
  }

  return (
    <div className='flex space-x-2'>
      <div className='w-full flex-1 md:w-auto md:flex-none'>
        <CommandMenu />
      </div>
      <nav className='flex items-center space-x-1'>
        <ThemeModeToggle />
      </nav>
      <div className='ml-auto flex items-center space-x-4'>
        <UserNav user={user} />
      </div>
    </div>
  );
}
