import { useMemo } from 'react';
import { ResponsiveCalendar } from '@nivo/calendar';

import { useGetTransactionsBy } from '@/app/budget/use-get-transactions-by';
import { groupBy } from '@/shared/utils/array';
import { formatStringDateToOnlyDateString } from '@/shared/utils/format';

interface Props {
  year: number;
}

export function BudgetYearCalendar({ year }: Props) {
  const { data } = useGetTransactionsBy(year);

  const transactions = useMemo(() => data ?? [], [data]);

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const calValues = useMemo(() => {
    if (transactions == undefined) {
      return;
    }
    const groupedByDate = groupBy(transactions, (x) => formatStringDateToOnlyDateString(x.executedAt));
    return Object.entries(groupedByDate).map((x) => ({
      day: x[0],
      value: x[1].length,
    }));
  }, [transactions]);

  const maxValue = calValues ? calValues.length + 30 : 'auto';

  return (
    <div className='w-full rounded bg-background py-3'>
      {calValues && (
        <>
          <div className='my-1 h-40'>
            <ResponsiveCalendar
              isInteractive
              data={calValues}
              dayBorderColor='hsl(var(--background))'
              dayBorderWidth={2}
              emptyColor='hsl(var(--calendar-value-empty))'
              from={from}
              margin={{ top: 0, right: 0, bottom: 0, left: 40 }}
              maxValue={maxValue}
              minValue={1}
              monthBorderColor='hsl(var(--background))'
              monthSpacing={5}
              to={to}
              tooltip={CustomTooltip}
              colors={[
                'hsl(var(--calendar-value-verylow))',
                'hsl(var(--calendar-value-low))',
                'hsl(var(--calendar-value-medium))',
                'hsl(var(--calendar-value-high))',
              ]}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'row',
                  translateY: 36,
                  itemCount: 4,
                  itemWidth: 42,
                  itemHeight: 36,
                  itemsSpacing: 14,
                  itemDirection: 'right-to-left',
                },
              ]}
              theme={{
                background: 'hsl(var(--background))',
                labels: {
                  text: { fontSize: '13px', fill: 'hsl(var(--calendar-value-medium))' },
                },
              }}
            />
          </div>
          {/* Legend */}
          <div className='flex w-full flex-col items-center justify-center gap-2'>
            <div className='h-4 w-1/3 rounded-sm bg-gradient-to-r from-[hsl(var(--calendar-value-high))] to-[hsl(var(--calendar-value-verylow))] p-1'></div>
            <div className='text-xs'>High {'->'} Low</div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomTooltip({ value, day, color }: { value: string; day: string; color: string }) {
  return (
    <div className='rounded bg-muted p-2'>
      <div className='flex items-center justify-start gap-2'>
        <div className='h-4 w-4 rounded-full' style={{ backgroundColor: color }}></div>
        <div className='flex gap-2'>
          <div className='text-muted-foreground'>{day}:</div> <div className='font-bold'>{value}</div>
        </div>
      </div>
    </div>
  );
}
