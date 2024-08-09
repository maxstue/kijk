import { useMemo } from 'react';
import { ResponsiveTimeRange } from '@nivo/calendar';

import { useGetTransactionsBy } from '@/app/budget/use-get-transations-by';
import { Months, months } from '@/shared/types/app';
import { groupBy } from '@/shared/utils/array';
import { formatStringDateToOnlyDateString } from '@/shared/utils/format';

interface Props {
  year: number;
  month: Months;
}

export function BudgetMonthCalendar({ year, month }: Props) {
  const { data } = useGetTransactionsBy(year, month);

  const tempDate = new Date(year, months.indexOf(month) + 1, 0);
  const from = `${year}-${months.indexOf(month) + 1}-01`;
  const to = `${year}-${months.indexOf(month) + 1}-${tempDate.getDate()}`;

  const calValues = useMemo(() => {
    if (data.data == null) {
      return undefined;
    }
    const groupedByDate = groupBy(data.data, (x) => formatStringDateToOnlyDateString(x.executedAt));
    return Object.entries(groupedByDate).map((x) => ({
      day: x[0],
      value: x[1].length,
    }));
  }, [data.data]);

  const maxValue = calValues ? calValues.length + 30 : 'auto';

  return (
    <div className='flex w-full flex-col items-center justify-center rounded bg-background py-3'>
      {calValues && (
        <>
          <div className='my-2 flex h-36 w-1/2 items-center justify-center'>
            <ResponsiveTimeRange
              data={calValues}
              from={from}
              to={to}
              emptyColor='hsl(var(--calendar-value-empty))'
              theme={{
                background: 'hsl(var(--background))',
                labels: {
                  text: { fontSize: '13px', fill: 'hsl(var(--calendar-value-medium))' },
                },
              }}
              colors={[
                'hsl(var(--calendar-value-verylow))',
                'hsl(var(--calendar-value-low))',
                'hsl(var(--calendar-value-medium))',
                'hsl(var(--calendar-value-high))',
              ]}
              dayBorderWidth={2}
              dayBorderColor='hsl(var(--background))'
              margin={{ top: 0, right: 40, bottom: 0, left: 10 }}
              minValue={1}
              maxValue={maxValue}
              isInteractive
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
              tooltip={CustomTooltip}
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
        <div style={{ backgroundColor: color }} className='h-4 w-4 rounded-full'></div>
        <div className='flex gap-2'>
          <div className='text-muted-foreground'>{day}:</div> <div className='font-bold'>{value}</div>
        </div>
      </div>
    </div>
  );
}
