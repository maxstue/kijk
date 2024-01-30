import { useEffect } from 'react';
import { RouteApi, useNavigate } from '@tanstack/react-router';

import { Button, buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Months, months } from '@/shared/types/app';

const route = new RouteApi({ id: '/_protected/home/budget' });

type Props = React.HTMLAttributes<HTMLElement>;

export function BudgetMonthNav({ className, ...props }: Props) {
  const navigate = useNavigate({ from: '/home/budget' });
  const searchParams = route.useSearch();
  const currentMonth = (searchParams.month ?? months[new Date().getMonth()]) as Months;
  const month = (searchParams.month ?? months[new Date().getMonth()]) as Months;

  useEffect(() => {
    if (searchParams.month == null) {
      void navigate({ search: (prev) => ({ ...prev, month }) });
    }
  }, [navigate, month, searchParams]);

  const handleNavigate = (item: Months) => {
    void navigate({ search: (prev) => ({ ...prev, month: item }) });
  };

  return currentMonth ? (
    <nav className={cn('flex gap-2 overflow-auto py-2 lg:h-[calc(100dvh_*_0.60)] lg:flex-col', className)} {...props}>
      {months.map((item) => {
        return (
          <Button
            key={item}
            variant='ghost'
            onClick={() => handleNavigate(item)}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              currentMonth === item ? 'bg-primary text-primary-foreground' : '',
              'mx-2 justify-start',
            )}
          >
            {item}
          </Button>
        );
      })}
    </nav>
  ) : (
    <div className='text-muted-foreground'>Select a year</div>
  );
}
