import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import type { ChartConfig } from '@kijk/ui/components/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@kijk/ui/components/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { useQuery } from '@tanstack/react-query';
import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from 'recharts';

import { toAmount } from '@/app/budgets/helpers';
import { budgetStatisticsQueryOptions } from '@/shared/api/budgets/options';
import { formatStringToCurrency } from '@/shared/utils/format';

const monthsShown = 12;

// One series per small chart, so identity never depends on color; the budget is a dashed reference line.
const chartConfig = {
  budget: { color: 'var(--muted-foreground)', label: 'Budget' },
  spent: { color: 'var(--primary)', label: 'Spent' },
} satisfies ChartConfig;

interface Trend {
  id: string;
  name: string;
  spent: number[];
  budget: Array<number | null>;
}

/** Spending per category over the last twelve months up to the given month, as small multiples or table. */
export function BudgetStatistics({ month, year }: { month: number; year: number }) {
  const { data } = useQuery(budgetStatisticsQueryOptions(year, month, monthsShown));
  if (!data) {
    return null;
  }

  const labels = data.months.map((value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
  );
  const trends: Trend[] = [
    {
      budget: data.totalBudget.map((value) => toAmount(value) || null),
      id: 'total',
      name: 'All expenses',
      spent: data.totalSpent.map(toAmount),
    },
    ...data.categories
      .map((category) => ({
        budget: category.budget.map((value) => (value === null ? null : toAmount(value))),
        id: category.categoryId,
        name: category.name,
        spent: category.spent.map(toAmount),
      }))
      .sort((a, b) => sum(b.spent) - sum(a.spent)),
  ];
  const uncategorized = data.uncategorized.map(toAmount);
  if (sum(uncategorized) > 0) {
    trends.push({
      budget: uncategorized.map(() => null),
      id: 'uncategorized',
      name: 'Uncategorized',
      spent: uncategorized,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending over time</CardTitle>
        <CardDescription>
          Booked expenses minus refunds per category for the last {monthsShown} months; the dashed line is the budget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='chart'>
          <TabsList>
            <TabsTrigger value='chart'>Chart</TabsTrigger>
            <TabsTrigger value='table'>Table</TabsTrigger>
          </TabsList>
          <TabsContent className='grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3' value='chart'>
            {trends.map((trend) => (
              <TrendChart key={trend.id} labels={labels} trend={trend} />
            ))}
          </TabsContent>
          <TabsContent className='overflow-x-auto pt-2' value='table'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  {labels.map((label) => (
                    <TableHead key={label} className='text-right'>
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((trend) => (
                  <TableRow key={trend.id}>
                    <TableCell className='font-medium'>{trend.name}</TableCell>
                    {trend.spent.map((value, index) => (
                      <TableCell key={labels[index]} className='text-right whitespace-nowrap'>
                        {formatStringToCurrency(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TrendChart({ labels, trend }: { labels: string[]; trend: Trend }) {
  const data = labels.map((label, index) => ({
    budget: trend.budget[index],
    month: label,
    spent: Math.max(0, trend.spent[index] ?? 0),
  }));

  return (
    <div className='rounded-md border p-3'>
      <div className='flex items-baseline justify-between gap-2'>
        <span className='text-sm font-medium'>{trend.name}</span>
        <span className='text-muted-foreground text-xs'>{formatStringToCurrency(sum(trend.spent))} total</span>
      </div>
      <ChartContainer className='aspect-auto h-28 w-full' config={chartConfig}>
        <ComposedChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis axisLine={false} dataKey='month' interval='preserveStartEnd' tickLine={false} tickMargin={4} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Bar dataKey='spent' fill='var(--color-spent)' radius={[4, 4, 0, 0]} />
          <Line
            connectNulls={false}
            dataKey='budget'
            dot={false}
            stroke='var(--color-budget)'
            strokeDasharray='4 3'
            strokeWidth={2}
            type='step'
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
