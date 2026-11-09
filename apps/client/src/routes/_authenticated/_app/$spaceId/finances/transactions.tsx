import * as accountsOptions from '@kijk/api/accounts/options';
import * as budgetsOptions from '@kijk/api/budgets/options';
import * as categoriesOptions from '@kijk/api/categories/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import * as transactionsOptions from '@kijk/api/transactions/options';
import { Button } from '@kijk/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { createFileRoute, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { MoreHorizontal, Upload } from 'lucide-react';
import { z } from 'zod';

import { BudgetWarnings } from '@/app/budgets/warnings';
import { defaultTransactionPageSize, transactionPageSizes } from '@/app/transactions/constants';
import { CreateTransactionDialog } from '@/app/transactions/create-dialog';
import { TransactionExportMenuItem } from '@/app/transactions/export-menu-item';
import { TransactionFilterControls } from '@/app/transactions/filter-controls';
import { TransactionList } from '@/app/transactions/list';
import { ResponsiveTransactionFilters } from '@/app/transactions/responsive-filters';
import { RuleSuggestions } from '@/app/transactions/rule-suggestions';
import { TransactionViewTabs } from '@/app/transactions/view-tabs';
import { RouteError } from '@/shared/components/errors/route-error';
import { PageAddButton } from '@/shared/components/page-header';
import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

const searchSchema = z.object({
  categoryIds: z.array(z.string()).optional(),
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(new Date().getMonth() + 1),
  page: z.number().int().min(1).optional(),
  // Unknown sizes, e.g. from an edited URL, fall back to the default.
  pageSize: z.literal(transactionPageSizes).optional().catch(undefined),
  uncategorized: z.boolean().optional(),
  year: z.number().int().min(2000).max(9999).default(new Date().getFullYear()),
});

const currentYear = () => new Date().getFullYear();
const currentMonth = () => new Date().getMonth() + 1;

/**
 * The list's filters: the month of the search params, optionally only its uncategorized transactions or only those in
 * the selected categories. The two exclude each other, so the category filter only applies to all transactions.
 */
function toFilters({ categoryIds, month, uncategorized, year }: z.infer<typeof searchSchema>) {
  return { categoryIds: uncategorized ? undefined : categoryIds, month, uncategorized, year };
}

/** The filters plus page and page size of the search params; changing the filters starts at the first page again. */
function toPageQuery(search: z.infer<typeof searchSchema>) {
  return { ...toFilters(search), page: search.page ?? 1, pageSize: search.pageSize ?? defaultTransactionPageSize };
}

/**
 * `/finances/transactions`: one page of the transactions of the month in the search params, optionally only
 * uncategorized ones.
 */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/transactions')({
  validateSearch: zodValidator(searchSchema),
  component: TransactionsPage,
  errorComponent: RouteError,
  loaderDeps: ({ search }) => toPageQuery(search),
  loader: async ({ params: { spaceId }, context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.query({ ...transactionsOptions.listQueryOptions(spaceId, deps), staleTime: 'static' }),
      queryClient.query({ ...categoriesOptions.listQueryOptions(spaceId), staleTime: 'static' }),
      queryClient.query({ ...accountsOptions.listQueryOptions(spaceId), staleTime: 'static' }),
      queryClient.query({
        ...budgetsOptions.overviewQueryOptions(spaceId, currentYear(), currentMonth()),
        staleTime: 'static',
      }),
    ]);
  },
  head: () => ({ meta: [{ title: 'Transactions' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function TransactionsPage() {
  const spaceId = useSpaceId();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const canRecord = useSpacePermission(SpacePermissions.finances.record);

  return (
    <div data-guide='transactions' className='space-y-6 pt-6'>
      <PageToolbar>
        <PageToolbarControls>
          <TransactionViewTabs />

          <ResponsiveTransactionFilters mobile={<TransactionFilterControls compact={false} />}>
            <TransactionFilterControls />
          </ResponsiveTransactionFilters>
        </PageToolbarControls>
        <PageToolbarActions>
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button aria-label='More actions' title='More actions' size='icon' variant='outline' />}
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem render={<Link params={{ spaceId }} to='/$spaceId/finances/imports' />}>
                  <Upload /> Import CSV
                </DropdownMenuItem>
                <TransactionExportMenuItem filters={toFilters(search)} />
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateTransactionDialog>
              <PageAddButton
                disabled={!canRecord}
                title={canRecord ? undefined : 'Your role in this space does not allow recording transactions'}
              >
                Add transaction
              </PageAddButton>
            </CreateTransactionDialog>
          </>
        </PageToolbarActions>
      </PageToolbar>
      <BudgetWarnings month={currentMonth()} year={currentYear()} />
      {search.uncategorized && <RuleSuggestions canRecord={canRecord} />}
      <TransactionList
        query={toPageQuery(search)}
        selectable={canRecord}
        onPageChange={(page) =>
          navigate({ search: (previous) => ({ ...previous, page: page > 1 ? page : undefined }) })
        }
        onPageSizeChange={(pageSize) =>
          navigate({
            search: (previous) => ({
              ...previous,
              page: undefined,
              pageSize: pageSize === defaultTransactionPageSize ? undefined : pageSize,
            }),
          })
        }
      />
    </div>
  );
}
