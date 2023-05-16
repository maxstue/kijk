'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/classnames';
import { homeConfig } from '@/app/(home)/constants';

export function HomeNav() {
  const pathname = usePathname();

  return (
    <>
      {homeConfig.mainNav?.length ? (
        <nav className='hidden gap-6 md:flex'>
          {homeConfig.mainNav?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '/' : item.href}
              className={cn(
                'flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm',
                pathname === item.href ? 'text-foreground' : 'text-foreground/60',
                item.disabled && 'cursor-not-allowed opacity-80'
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
