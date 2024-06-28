import { useEffect } from 'react';
import { getRouteApi, Link } from '@tanstack/react-router';

import { buttonVariants } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/helpers';
import { months } from '@/shared/types/app';

const Route = getRouteApi('/_protected/budget');

type Props = React.HTMLAttributes<HTMLElement>;

export function BudgetMonthNav({ className, ...props }: Props) {
  const navigate = Route.useNavigate();
  const searchParams = Route.useSearch();

  // set month in the url when it changes
  useEffect(() => {
    navigate({ search: (prev) => ({ ...prev, month: searchParams.month }) });
  }, [navigate, searchParams.month]);

  return (
    <nav className={cn('flex gap-2 overflow-auto py-2 lg:h-[calc(100dvh_*_0.60)] lg:flex-col', className)} {...props}>
      {months.map((item) => {
        return (
          <Link
            key={item}
            preload={false}
            search={(prev) => ({ ...prev, month: item })}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'justify-start text-primary/65 data-[status=active]:bg-primary data-[status=active]:text-primary-foreground',
            )}
          >
            {item}
          </Link>
        );
      })}
    </nav>
  );
}
