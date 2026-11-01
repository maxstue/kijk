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

export function Consumptions({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.consumptionsQueryOptions(spaceId, year));
  const canView = useSpacePermission('consumptions:view');
  const resources = [...new Set(query.data?.map((item) => item.resourceId) ?? [])];
  return (
    <Section title='Consumptions' pending={query.isPending} error={query.isError} retry={() => void query.refetch()}>
      {resources.length === 0 ? (
        <p>No consumption data for this year.</p>
      ) : (
        resources.map((resourceId) => {
          const rows = query.data?.filter((item) => item.resourceId === resourceId) ?? [];
          const selected = rows.find((item) => item.month === month);
          return (
            <div key={resourceId}>
              <h3 className='font-medium'>
                {rows[0]?.name} · {rows[0]?.unit}
              </h3>
              <p>
                {selected
                  ? `${selected.value?.toLocaleString()} ${selected.unit}`
                  : 'No readings for the selected month.'}
              </p>
              <AnnualChart
                year={year}
                month={month}
                unit={rows[0]?.unit ?? ''}
                values={months.map((_, index) => {
                  const row = rows.find((item) => item.month === index + 1);
                  return row ? Number(row.value) : null;
                })}
              />
            </div>
          );
        })
      )}
      {canView && (
        <Link className='underline' to='/$spaceId/consumptions' params={{ spaceId }}>
          View consumptions
        </Link>
      )}
    </Section>
  );
}
