import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Progress } from '@kijk/ui/components/progress';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pencil, PiggyBank, TriangleAlert } from 'lucide-react';
import { Suspense, lazy, useState } from 'react';

import { BudgetForm } from '@/app/budgets/form';
import { toAmount } from '@/app/budgets/helpers';
import { budgetOverviewQueryOptions } from '@/shared/api/budgets/options';
import type { BudgetCategory } from '@/shared/api/budgets/types';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { ResourceIcon } from '@/shared/components/resource-icon';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

// Recharts is large; load it only when there is something to chart.
const BudgetChart = lazy(() => import('@/app/budgets/chart').then((module) => ({ default: module.BudgetChart })));

interface Props {
  /** The evaluated month (1-12). */
  month: number;
  year: number;
}

/** Budget evaluation of a month: totals, warnings, a comparison chart and one card per category. */
export function BudgetOverview({ month, year }: Props) {
  const { data } = useSuspenseQuery(budgetOverviewQueryOptions(year, month));
  const budgeted = data.categories.filter((category) => category.budget !== null && category.budget !== undefined);
  const exceeded = data.categories.filter((category) => category.isExceeded);

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <SummaryCard
          description={`of ${formatStringToCurrency(data.totalBudget)} budgeted`}
          title='Spent'
          value={data.totalSpent}
        />
        <SummaryCard description='Booked in income categories' title='Income' value={data.income} />
        <SummaryCard
          description={`Plus ${formatStringToCurrency(data.uncategorizedIncome)} incoming without category`}
          title='Uncategorized'
          value={data.uncategorizedExpenses}
        />
        <SummaryCard description='Not booked yet, not counted' title='Pending' value={data.pendingExpenses} />
      </div>
      {exceeded.length > 0 && (
        <Alert variant='destructive'>
          <TriangleAlert />
          <AlertTitle>Budget exceeded</AlertTitle>
          <AlertDescription>
            {exceeded.map((category) => category.name).join(', ')} {exceeded.length === 1 ? 'is' : 'are'} over budget
            this month.
          </AlertDescription>
        </Alert>
      )}
      {budgeted.length > 0 && (
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
      {data.categories.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
            <PiggyBank className='text-muted-foreground size-8' />
            <p className='font-medium'>No budgets or expenses this month</p>
            <p className='text-muted-foreground text-sm'>Set a budget or record transactions to see your spending.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {data.categories.map((category) => (
            <CategoryCard key={category.categoryId} category={category} month={month} year={year} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ description, title, value }: { description: string; title: string; value: number | string }) {
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

function CategoryCard({ category, month, year }: { category: BudgetCategory; month: number; year: number }) {
  const canPlan = useHouseholdPermission(HouseholdPermissions.budgets.plan);
  const [showDialog, setShowDialog] = useState(false);
  const hasBudget = category.budget !== null && category.budget !== undefined;
  const utilization = toAmount(category.utilizationPercentage);
  const pending = toAmount(category.pending);

  return (
    <Card className={category.isExceeded ? 'border-destructive' : undefined}>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <ResourceIcon className='size-5' color={category.color} name={category.icon} />
            <CardTitle>{category.name}</CardTitle>
          </div>
          {category.isExceeded && <Badge variant='destructive'>Over budget</Badge>}
          {!hasBudget && <Badge variant='secondary'>No budget</Badge>}
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-end justify-between gap-2'>
          <span className='text-2xl font-bold'>{formatStringToCurrency(category.spent)}</span>
          {hasBudget && (
            <span className='text-muted-foreground text-sm'>of {formatStringToCurrency(category.budget ?? 0)}</span>
          )}
        </div>
        {hasBudget && (
          <>
            <Progress
              className={category.isExceeded ? '[&_[data-slot=progress-indicator]]:bg-destructive' : undefined}
              value={Math.min(100, Math.max(0, utilization))}
            />
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>{utilization.toLocaleString()}% used</span>
              <span>{formatStringToCurrency(category.remaining ?? 0)} left</span>
            </div>
          </>
        )}
        {pending > 0 && (
          <p className='text-muted-foreground text-xs'>{formatStringToCurrency(pending)} pending, not counted yet</p>
        )}
        <div className='flex justify-end'>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                disabled={!canPlan}
                size='sm'
                title={canPlan ? undefined : 'Your household role does not allow planning budgets'}
                variant='ghost'
              >
                <Pencil /> {hasBudget ? 'Change budget' : 'Set budget'}
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle>Budget for {category.name}</DialogTitle>
                <DialogDescription>Earlier months keep their previous budget.</DialogDescription>
              </DialogHeader>
              <BudgetForm
                categoryId={category.categoryId}
                initialAmount={hasBudget ? toAmount(category.budget) : undefined}
                month={month}
                year={year}
                onClose={() => setShowDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
