import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Suspense, lazy, useState } from 'react';
import { z } from 'zod';

import { BudgetForm } from '@/app/budgets/form';
import { BudgetOverview } from '@/app/budgets/overview';
import { budgetOverviewQueryOptions, budgetsQueryOptions } from '@/shared/api/budgets/options';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { AppError } from '@/shared/components/errors/app-error';
import { MonthSwitcher } from '@/shared/components/month-switcher';
import { PageAddButton, PageToolbar } from '@/shared/components/page-header';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

// Loaded on demand when viewing category spending.
const BudgetStatistics = lazy(() =>
  import('@/app/budgets/statistics').then((module) => ({ default: module.BudgetStatistics })),
);

const searchSchema = z.object({
  view: z.enum(['budgets', 'spending']).default('budgets'),
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(new Date().getMonth() + 1),
  year: z.number().int().min(2000).max(9999).default(new Date().getFullYear()),
});

/** Budget evaluation of the month in the search params. */
export const Route = createFileRoute('/_authenticated/_app/finances/budgets')({
  component: BudgetsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.query({
        ...budgetOverviewQueryOptions(deps.year, deps.month),
        staleTime: 'static',
      }),
      queryClient.query({ ...budgetsQueryOptions(), staleTime: 'static' }),
      queryClient.query({ ...categoriesQueryOptions(), staleTime: 'static' }),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function BudgetsPage() {
  useSetSiteHeader('Budgets');
  const { month, view, year } = Route.useSearch();
  const navigate = Route.useNavigate();
  const canPlanShared = useSpacePermission(SpacePermissions.budgets.plan);
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  // Members without budgets:plan may still keep private budgets.
  const canPlan = canPlanShared || canRecord;
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className='space-y-6 pt-6'>
      <PageToolbar
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <PageAddButton
                disabled={!canPlan}
                title={canPlan ? undefined : 'Your role in this space does not allow planning budgets'}
              >
                Set budget
              </PageAddButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set budget</DialogTitle>
                <DialogDescription>Choose an expense category and its monthly amount.</DialogDescription>
              </DialogHeader>
              <BudgetForm month={month} year={year} onClose={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        }
      >
        <MonthSwitcher
          month={month}
          year={year}
          onChange={(monthSearch) => navigate({ search: (previous) => ({ ...previous, ...monthSearch }) })}
        />
      </PageToolbar>
      <Tabs
        className='gap-6'
        value={view}
        onValueChange={(value) => {
          if (value === 'budgets' || value === 'spending') {
            void navigate({ search: (previous) => ({ ...previous, view: value }) });
          }
        }}
      >
        <TabsList aria-label='Budget views'>
          <TabsTrigger value='budgets'>Budgets</TabsTrigger>
          <TabsTrigger value='spending'>Category spending</TabsTrigger>
        </TabsList>
        <TabsContent value='budgets'>
          <BudgetOverview month={month} year={year} />
        </TabsContent>
        <TabsContent className='space-y-6' value='spending'>
          <BudgetOverview month={month} view='spending' year={year} />
          <Suspense fallback={<Loader className='h-6 w-6' />}>
            <BudgetStatistics month={month} year={year} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
