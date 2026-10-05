import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Separator } from '@kijk/ui/components/separator';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus } from 'lucide-react';
import { Suspense, lazy, useState } from 'react';
import { z } from 'zod';

import { CategoriesDialog } from '@/app/budgets/categories-dialog';
import { BudgetForm } from '@/app/budgets/form';
import { BudgetOverview } from '@/app/budgets/overview';
import { budgetOverviewQueryOptions, budgetsQueryOptions } from '@/shared/api/budgets/options';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { AppError } from '@/shared/components/errors/app-error';
import { MonthSwitcher } from '@/shared/components/month-switcher';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

// Loaded on demand: the statistics sit below the overview and pull in the chart library.
const BudgetStatistics = lazy(() =>
  import('@/app/budgets/statistics').then((module) => ({ default: module.BudgetStatistics })),
);

const searchSchema = z.object({
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(new Date().getMonth() + 1),
  year: z.number().int().min(2000).max(9999).default(new Date().getFullYear()),
});

/** `/budgets`: budget evaluation of the month in the search params. */
export const Route = createFileRoute('/_authenticated/_app/budgets')({
  component: BudgetsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.ensureQueryData(budgetOverviewQueryOptions(deps.year, deps.month)),
      queryClient.ensureQueryData(budgetsQueryOptions()),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function BudgetsPage() {
  useSetSiteHeader('Budgets');
  const { month, year } = Route.useSearch();
  const navigate = Route.useNavigate();
  const canPlan = useHouseholdPermission(HouseholdPermissions.budgets.plan);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className='space-y-6 pt-10'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Budgets</h2>
          <p className='text-muted-foreground'>Plan monthly spending per category and see where your money goes.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <MonthSwitcher month={month} year={year} onChange={(search) => navigate({ search })} />
          <CategoriesDialog />
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                disabled={!canPlan}
                title={canPlan ? undefined : 'Your household role does not allow planning budgets'}
              >
                <Plus /> Set budget
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle>Set budget</DialogTitle>
                <DialogDescription>Choose an expense category and its monthly amount.</DialogDescription>
              </DialogHeader>
              <BudgetForm month={month} year={year} onClose={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Separator />
      <BudgetOverview month={month} year={year} />
      <Suspense fallback={<Loader className='h-6 w-6' />}>
        <BudgetStatistics month={month} year={year} />
      </Suspense>
    </div>
  );
}
