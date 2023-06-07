'use client';

import Link from 'next/link';

import { cn } from '@/lib/classnames';
import { useSearchQuery } from '@/hooks/use-search-query';
import { buttonVariants } from '@/components/ui/button';
import { months } from '@/types/app';

type Props = React.HTMLAttributes<HTMLElement>;

export function MonthNav({ className, ...props }: Props) {
  const { getQueryString, createLinkString } = useSearchQuery();
  const currentMonth = getQueryString('month', months[new Date().getMonth()]);

  return currentMonth ? (
    <nav className={cn('flex overflow-auto lg:flex-col', className)} {...props}>
      {months.map((item) => {
        return (
          <Link
            key={item}
            href={createLinkString('month', item)}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              currentMonth === item
                ? 'bg-muted-foreground text-white hover:bg-muted-foreground hover:text-white'
                : 'hover:bg-muted-foreground hover:text-white ',
              'justify-start'
            )}
          >
            {item}
          </Link>
        );
      })}
    </nav>
  ) : (
    <div className='text-muted-foreground'>Select a year</div>
  );
}
