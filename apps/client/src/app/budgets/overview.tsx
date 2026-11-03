import * as budgetsOptions from '@kijk/api/budgets/options';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PiggyBank } from 'lucide-react';
import { Suspense, lazy } from 'react';

import { toAmount } from '@/app/budgets/helpers';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

import { CategoryCard } from './category-card';

// Load chart code only when there is something to chart.
const BudgetChart = lazy(() => import('@/app/budgets/chart').then((module) => ({ default: module.BudgetChart })));

interface Props {
  /** The evaluated month (1-12). */
  month: number;
  view?: 'budgets' | 'spending';
  year: number;
}

/** Monthly budgets or spending across all expense categories. */
export function BudgetOverview({ month, view = 'budgets', year }: Props) {
  const spaceId = useSpaceId();
  const { data } = useSuspenseQuery(budgetsOptions.overviewQueryOptions(spaceId, year, month));
  const budgeted = data.categories.filter((category) => category.budget !== null && category.budget !== undefined);
  const categories = view === 'budgets' ? budgeted : data.categories;
  const budgetedSpent = budgeted.reduce((total, category) => total + toAmount(category.spent), 0);

  return (
    <div className='space-y-6'>
      {view === 'budgets' ? (
        <div className='grid gap-4 sm:grid-cols-3'>
          <SummaryCard description='Planned for this month' title='Budgeted' value={data.totalBudget} />
          <SummaryCard description='In categories with a budget' title='Spent' value={budgetedSpent} />
          <SummaryCard
            description='Across your planned budgets'
            title='Remaining'
            value={toAmount(data.totalBudget) - budgetedSpent}
          />
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <SummaryCard description='Across all expense categories' title='Spent' value={data.totalSpent} />
          <SummaryCard description='Booked in income categories' title='Income' value={data.income} />
          <SummaryCard
            description={`Plus ${formatStringToCurrency(data.uncategorizedIncome)} incoming without category`}
            title='Uncategorized'
            value={data.uncategorizedExpenses}
          />
          <SummaryCard description='Not booked yet, not counted' title='Pending' value={data.pendingExpenses} />
        </div>
      )}
      {view === 'budgets' && budgeted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget vs. spending</CardTitle>
            <CardDescription>Booked expenses minus refunds per category.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className='h-72' />}>
              <BudgetChart categories={budgeted} />
            </Suspense>
          </CardContent>
        </Card>
      )}
      {categories.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
            <PiggyBank className='text-muted-foreground size-8' />
            <p className='font-medium'>
              {view === 'budgets' ? 'No budgets this month' : 'No category expenses this month'}
            </p>
            <p className='text-muted-foreground text-sm'>
              {view === 'budgets'
                ? 'Set a budget to plan your spending. All category expenses are available in Category spending.'
                : 'Record categorized transactions to see your spending.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {categories.map((category) => (
            <CategoryCard key={category.categoryId} category={category} month={month} year={year} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  description: string;
  title: string;
  value: number | string;
}

function SummaryCard({ description, title, value }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-2xl'>{formatStringToCurrency(value)}</CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground text-sm'>{description}</CardContent>
    </Card>
  );
}
