import * as dashboardOptions from '@kijk/api/dashboard/options';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { Section } from './section';

interface Props {
  spaceId: string;
  year: number;
  month: number;
}

export function Finances({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.financesQueryOptions(spaceId, year));
  const canView = useSpacePermission('finances:view');
  const currencies = [...new Set(query.data?.map((item) => item.currency) ?? [])];
  return (
    <Section
      title='Finances'
      size='finance'
      description='Shared income and spending. Balance = income − expenses.'
      pending={query.isPending}
      error={query.isError}
      retry={() => void query.refetch()}
    >
      {currencies.length === 0 ? (
        <p>No shared financial data for this year.</p>
      ) : (
        currencies.map((currency) => {
          const rows = query.data?.filter((item) => item.currency === currency) ?? [];
          const selected = rows.find((item) => item.month === month);
          return (
            <div key={currency} className='flex min-w-0 flex-col gap-4'>
              <h3 className='sr-only'>{currency}</h3>
              {selected?.hasData ? (
                <dl className='grid grid-cols-1 gap-4 @sm/home:grid-cols-3 @sm/home:divide-x'>
                  {[
                    { label: 'Income', value: selected.income },
                    { label: 'Expenses', value: selected.expenses },
                    { label: 'Balance', value: selected.balance },
                  ].map((metric) => (
                    <div key={metric.label} className='flex min-w-0 flex-col gap-2 px-3 first:pl-0'>
                      <dt className='text-muted-foreground text-xs'>{metric.label}</dt>
                      <dd className='text-base font-semibold tracking-tight tabular-nums @xl/home:text-2xl'>
                        {metric.value?.toLocaleString()} {currency}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className='text-muted-foreground'>No bookings for the selected month.</p>
              )}
            </div>
          );
        })
      )}
      {canView && (
        <Link
          className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          to='/$spaceId/finances'
          params={{ spaceId }}
        >
          View finances
        </Link>
      )}
    </Section>
  );
}
