'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { months } from '@/app/(home)/wallet/_components/schemas';
import { cn } from '@/lib/classnames';
import { buttonVariants } from '@/components/ui/button';

interface Props extends React.HTMLAttributes<HTMLElement> {}

export function MonthNav({ className, ...props }: Props) {
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get('month') ?? months[new Date().getMonth()];
  // TODO only show if searcparams contains "year"
  // than calculate the current month and set searchparam
  // https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams

  return (
    <nav className={cn('flex lg:flex-col', className)} {...props}>
      {searchParams.get('year') ? (
        <>
          {months.map((item) => {
            return (
              <Link
                key={item}
                href={{
                  pathname: '/wallet',
                  query: { month: item },
                }}
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
