'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/classnames';
import { useSearchQuery } from '@/hooks/use-search-query';
import { buttonVariants } from '@/components/ui/button';
import { months } from '@/types/app';

interface Props extends React.HTMLAttributes<HTMLElement> {}

export function MonthNav({ className, ...props }: Props) {
  const { getQueryString, createLinkString, isQuerySet, pushQueryString } = useSearchQuery();
  const currentMonth = getQueryString('month', months[new Date().getMonth()]);

  useEffect(() => {
    if (!isQuerySet('month')) {
      pushQueryString('month', months[new Date().getMonth()]);
    }
  }, [isQuerySet, pushQueryString]);

  return (
    <nav className={cn('flex lg:flex-col', className)} {...props}>
      {currentMonth ? (
        <>
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
        </>
      ) : (
        <div className='text-muted-foreground'>Select a year</div>
      )}
    </nav>
  );
}
