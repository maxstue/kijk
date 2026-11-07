import { Chart } from '@kijk/ui/components/chart';
import { useMemo, useState } from 'react';

import { createAnnualChartDefinition } from './annual-chart-definition';
import { AnnualValuesTable } from './annual-values-table';
import { months } from './constants';
import { type AnnualChartProps } from './types';

/** Calendar-year area chart. Missing readings split the series instead of inventing a connecting curve. */
export function AnnualChart({ values, series, year, month, unit }: AnnualChartProps) {
  const [now] = useState(() => new Date());
  const definition = useMemo(
    () => createAnnualChartDefinition({ values, series, year, month, unit, now }),
    [series, values, year, month, unit, now],
  );
  const groups = series ?? [{ label: unit, color: 'var(--color-teal-500)', values: values ?? [] }];
  return (
    <figure className='flex min-w-0 flex-col gap-4' aria-label={`${months[month - 1]} ${year} highlighted in ${unit}`}>
      <Chart ariaLabel={`January to December ${year}, ${unit}`} definition={definition} height={300} />
      <AnnualValuesTable groups={groups} year={year} month={month} unit={unit} now={now} />
    </figure>
  );
}

export type { AnnualSeries } from './types';
