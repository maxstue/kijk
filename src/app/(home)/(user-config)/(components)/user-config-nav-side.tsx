'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/classnames';
import { Icons } from '@/components/icons';
import { homeConfig } from '@/app/(home)/constants';

export function UserConfigNavSide() {
  const path = usePathname();

  return (
    <nav className='grid items-start gap-2'>
      {homeConfig.sidebarNav.map(({ title, href, icon, disabled }) => {
        const Icon = Icons[icon || 'arrowRight'];
        return (
          <Link key={title} href={disabled ? '/' : href}>
            <span
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                path === href ? 'bg-accent' : 'transparent',
                disabled && 'cursor-not-allowed opacity-80'
              )}
            >
              <Icon className='mr-2 h-4 w-4' />
              <span>{title}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
