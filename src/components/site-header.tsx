'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/classnames';
import { Icons } from '@/components/icons';
import { MainNavItem } from '@/types/nav';

interface Props {
  children?: ReactNode;
  navItems?: MainNavItem[];
}

export function SiteHeader({ children, navItems = [] }: Props) {
  const pathname = usePathname();

  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
          {navItems?.length ? (
            <nav className='hidden gap-6 md:flex'>
              {navItems?.map((item, index) => (
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
        </div>
        <div className='flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end'>{children}</div>
      </div>
    </header>
  );
}
