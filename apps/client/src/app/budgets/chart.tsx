import type { ChartConfig } from '@kijk/ui/components/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@kijk/ui/components/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { toAmount } from '@/app/budgets/helpers';
import type { BudgetCategory } from '@/shared/api/budgets/types';

const chartConfig = {
  budget: { color: 'var(--muted-foreground)', label: 'Budget' },
  spent: { color: 'var(--primary)', label: 'Spent' },
} satisfies ChartConfig;

/** Bar chart comparing budget and spending per category. */
export function BudgetChart({ categories }: { categories: BudgetCategory[] }) {
  const data = categories.map((category) => ({
    budget: toAmount(category.budget),
    name: category.name,
    spent: Math.max(0, toAmount(category.spent)),
  }));

  return (
    <ChartContainer className='aspect-auto h-72 w-full' config={chartConfig}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey='name' tickLine={false} tickMargin={8} />
        <YAxis axisLine={false} tickLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Bar dataKey='budget' fill='var(--color-budget)' radius={4} />
        <Bar dataKey='spent' fill='var(--color-spent)' radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
