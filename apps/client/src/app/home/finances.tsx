import * as dashboardOptions from '@kijk/api/dashboard/options';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { AnnualChart } from './annual-chart';
import { months } from './constants';
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
    <Section title='Finances' pending={query.isPending} error={query.isError} retry={() => void query.refetch()}>
      {currencies.length === 0 ? (
        <p>No shared financial data for this year.</p>
      ) : (
        currencies.map((currency) => {
          const rows = query.data?.filter((item) => item.currency === currency) ?? [];
          const selected = rows.find((item) => item.month === month);
          return (
            <div key={currency}>
              <h3 className='font-medium'>{currency}</h3>
              {selected?.hasData ? (
                <dl className='flex flex-wrap gap-6'>
                  <div>
                    <dt>Income</dt>
                    <dd>
                      {selected.income?.toLocaleString()} {currency}
                    </dd>
                  </div>
                  <div>
                    <dt>Expenses</dt>
                    <dd>
                      {selected.expenses?.toLocaleString()} {currency}
                    </dd>
                  </div>
                  <div>
                    <dt>Balance</dt>
                    <dd>
                      {selected.balance?.toLocaleString()} {currency}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p>No bookings for the selected month.</p>
              )}
              <h4>Income · {year}</h4>
              <AnnualChart
                year={year}
                month={month}
                unit={currency ?? ''}
                values={months.map((_, index) => {
                  const row = rows.find((item) => item.month === index + 1);
                  return row?.hasData ? Number(row.income) : null;
                })}
              />
              <h4>Expenses · {year}</h4>
              <AnnualChart
                year={year}
                month={month}
                unit={currency ?? ''}
                values={months.map((_, index) => {
                  const row = rows.find((item) => item.month === index + 1);
                  return row?.hasData ? Number(row.expenses) : null;
                })}
              />
            </div>
          );
        })
      )}
      {canView && (
        <Link className='underline' to='/$spaceId/finances' params={{ spaceId }}>
          View finances
        </Link>
      )}
    </Section>
  );
}
