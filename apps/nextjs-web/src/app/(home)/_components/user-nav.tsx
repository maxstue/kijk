'use client';

import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { signOut } from 'next-auth/react';

import { homeConfig } from '@/app/(home)/constants';
import { getInitailChars } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppUser } from '@/types/user';

interface Props {
  user: AppUser;
}

export function UserNav({ user }: Props) {
  const userInitials = getInitailChars(user.name);

  const handleSignOut = (event: Event) => {
    event.preventDefault();
    signOut({
      callbackUrl: `${window.location.origin}`,
    }).catch((err) => Sentry.captureException(err));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src='/avatars/01.png' alt={user.name ?? userInitials} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {homeConfig.sidebarNav.map(({ title, href, icon }) => {
            const Icon = Icons[icon || 'arrowRight'];
            return (
              <DropdownMenuItem key={title} asChild className='cursor-pointer'>
                <Link href={href} className='flex w-full'>
                  <Icon className='mr-2 h-4 w-4' />
                  <span>{title}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer' onSelect={handleSignOut}>
          <Icons.logOut className='mr-2 h-4 w-4' />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
