import { Chart } from '@kijk/ui/components/chart';
import { chartTheme, getChartTooltipContent } from '@kijk/ui/lib/chart';
import { barY, defineChart, group } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { useMemo } from 'react';

import { toAmount } from '@/app/budgets/helpers';
import type { BudgetCategory } from '@/shared/api/budgets/types';
import { formatStringToCurrency } from '@/shared/utils/format';

/** Bar chart comparing budget and spending per category. */
export function BudgetChart({ categories }: { categories: BudgetCategory[] }) {
  const definition = useMemo(() => {
    const data = categories.flatMap((category) => [
      { id: `${category.categoryId}-budget`, name: category.name, series: 'Budget', value: toAmount(category.budget) },
      {
        id: `${category.categoryId}-spent`,
        name: category.name,
        series: 'Spent',
        value: Math.max(0, toAmount(category.spent)),
      },
    ]);

    return defineChart({
      marks: [barY(data, { x: 'name', y: 'value', z: 'series', color: 'series', layout: group(), radius: 4 })],
      scales: {
        x: { scale: () => scaleBand<string>().padding(0.2), axis: { line: false, ticks: { size: 0, padding: 8 } } },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { line: false, ticks: { size: 0 } } },
      },
      color: { domain: ['Budget', 'Spent'], range: ['var(--muted-foreground)', 'var(--primary)'] },
      theme: chartTheme,
      focus: 'group-x',
      tooltip: {
        use: tooltip,
        content: (points, context) => getChartTooltipContent(points, context, formatStringToCurrency),
      },
    });
  }, [categories]);

  return <Chart ariaLabel='Budget and spending per category' definition={definition} height={288} />;
}
