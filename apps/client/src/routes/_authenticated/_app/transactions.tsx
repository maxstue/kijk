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
import { Switch } from '@kijk/ui/components/switch';
import { Link, createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { z } from 'zod';

import { BudgetWarnings } from '@/app/budgets/warnings';
import { AccountsDialog } from '@/app/transactions/accounts-dialog';
import { TransactionExportButton } from '@/app/transactions/export-button';
import { TransactionForm } from '@/app/transactions/form';
import { TransactionList } from '@/app/transactions/list';
import { RuleSuggestions } from '@/app/transactions/rule-suggestions';
import { RulesDialog } from '@/app/transactions/rules-dialog';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { budgetOverviewQueryOptions } from '@/shared/api/budgets/options';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { transactionsQueryOptions } from '@/shared/api/transactions/options';
import { AppError } from '@/shared/components/errors/app-error';
import { MonthSwitcher } from '@/shared/components/month-switcher';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

const searchSchema = z.object({
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(new Date().getMonth() + 1),
  uncategorized: z.boolean().optional(),
  year: z.number().int().min(2000).max(9999).default(new Date().getFullYear()),
});

const currentYear = () => new Date().getFullYear();
const currentMonth = () => new Date().getMonth() + 1;

/** The list's filters: the month of the search params, or all months when only uncategorized ones are shown. */
function toFilters({ month, uncategorized, year }: z.infer<typeof searchSchema>) {
  return uncategorized ? { uncategorized: true } : { month, year };
}

/** `/transactions`: transactions of the month in the search params, or all uncategorized ones. */
export const Route = createFileRoute('/_authenticated/_app/transactions')({
  component: TransactionsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => toFilters(search),
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.ensureQueryData(transactionsQueryOptions(deps)),
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(accountsQueryOptions()),
      queryClient.ensureQueryData(budgetOverviewQueryOptions(currentYear(), currentMonth())),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function TransactionsPage() {
  useSetSiteHeader('Transactions');
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const canRecord = useHouseholdPermission(HouseholdPermissions.finances.record);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const uncategorizedId = useId();

  return (
    <div className='space-y-6 pt-10'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Transactions</h2>
          <p className='text-muted-foreground'>Record and categorize the bookings behind your budgets.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {!search.uncategorized && (
            <MonthSwitcher
              month={search.month}
              year={search.year}
              onChange={(value) => navigate({ search: (previous) => ({ ...previous, ...value }) })}
            />
          )}
          <TransactionExportButton filters={toFilters(search)} />
          <AccountsDialog />
          <RulesDialog />
          <Button asChild variant='outline'>
            <Link to='/imports'>
              <Upload /> Import CSV
            </Link>
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                disabled={!canRecord}
                title={canRecord ? undefined : 'Your role in this space does not allow recording transactions'}
              >
                <Plus /> Add transaction
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle>Add transaction</DialogTitle>
                <DialogDescription>Record a booking by hand.</DialogDescription>
              </DialogHeader>
              <TransactionForm onClose={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <BudgetWarnings month={currentMonth()} year={currentYear()} />
      <Separator />
      <label className='flex w-fit items-center gap-2 text-sm' htmlFor={uncategorizedId}>
        <Switch
          checked={search.uncategorized ?? false}
          id={uncategorizedId}
          onCheckedChange={(checked) =>
            navigate({ search: (previous) => ({ ...previous, uncategorized: checked || undefined }) })
          }
        />
        Only uncategorized, from all months
      </label>
      {search.uncategorized && <RuleSuggestions canRecord={canRecord} />}
      <TransactionList filters={toFilters(search)} selectable={(search.uncategorized ?? false) && canRecord} />
    </div>
  );
}
