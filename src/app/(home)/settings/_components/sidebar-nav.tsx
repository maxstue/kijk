'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/classnames';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { NavItem } from '@/types/nav';

interface Props extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
}

export function SidebarNav({ className, items, ...props }: Props) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)} {...props}>
      {items.map(({ href, title, icon }) => {
        const Icon = Icons[icon || 'arrowRight'];
        return (
          <Link
            key={href.toString()}
            href={href}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              pathname === href
                ? 'bg-muted-foreground text-white hover:bg-muted-foreground hover:text-white'
                : 'hover:bg-muted-foreground hover:text-white ',
              'justify-start'
            )}
          >
            <Icon className='mr-2 h-4 w-4' />
            {title}
          </Link>
        );
      })}
    </nav>
  );
}
