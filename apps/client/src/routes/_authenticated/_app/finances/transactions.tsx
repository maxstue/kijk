import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { Tabs, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { Link, createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { ChevronDown, MoreHorizontal, SlidersHorizontal, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

import { BudgetWarnings } from '@/app/budgets/warnings';
import { TransactionCategoryFilter } from '@/app/transactions/category-filter';
import { defaultTransactionPageSize, transactionPageSizes } from '@/app/transactions/constants';
import { TransactionExportMenuItem } from '@/app/transactions/export-menu-item';
import { TransactionForm } from '@/app/transactions/form';
import { TransactionList } from '@/app/transactions/list';
import { RuleSuggestions } from '@/app/transactions/rule-suggestions';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { budgetOverviewQueryOptions } from '@/shared/api/budgets/options';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { transactionsQueryOptions } from '@/shared/api/transactions/options';
import { AppError } from '@/shared/components/errors/app-error';
import { MonthSwitcher } from '@/shared/components/month-switcher';
import { PageAddButton, PageToolbar } from '@/shared/components/page-header';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
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
  pageSize: z
    .number()
    .refine((value) => transactionPageSizes.some((size) => size === value))
    .optional()
    .catch(undefined),
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
export const Route = createFileRoute('/_authenticated/_app/finances/transactions')({
  component: TransactionsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => toPageQuery(search),
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.query({ ...transactionsQueryOptions(deps), staleTime: 'static' }),
      queryClient.query({ ...categoriesQueryOptions(), staleTime: 'static' }),
      queryClient.query({ ...accountsQueryOptions(), staleTime: 'static' }),
      queryClient.query({ ...budgetOverviewQueryOptions(currentYear(), currentMonth()), staleTime: 'static' }),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function TransactionsPage() {
  useSetSiteHeader('Transactions');
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filterControls = (compact: boolean) => (
    <>
      <MonthSwitcher
        month={search.month}
        year={search.year}
        onChange={(value) => navigate({ search: (previous) => ({ ...previous, ...value, page: undefined }) })}
      />
      {!search.uncategorized && (
        <TransactionCategoryFilter
          compact={compact}
          value={search.categoryIds ?? []}
          onChange={(categoryIds) =>
            navigate({
              search: (previous) => ({
                ...previous,
                categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
                page: undefined,
              }),
            })
          }
        />
      )}
      {(search.uncategorized || (search.categoryIds?.length ?? 0) > 0) && (
        <Button
          variant='ghost'
          onClick={() =>
            navigate({
              search: (previous) => ({
                ...previous,
                categoryIds: undefined,
                page: undefined,
                uncategorized: undefined,
              }),
            })
          }
        >
          Reset
          <X />
        </Button>
      )}
    </>
  );

  return (
    <div className='space-y-6 pt-6'>
      <PageToolbar
        tabs={
          <>
            <Tabs
              className='hidden @min-[32rem]/toolbar:flex'
              value={search.uncategorized ? 'uncategorized' : 'all'}
              onValueChange={(value) =>
                navigate({
                  search: (previous) => ({
                    ...previous,
                    page: undefined,
                    uncategorized: value === 'uncategorized' || undefined,
                  }),
                })
              }
            >
              <TabsList>
                <TabsTrigger value='all'>All</TabsTrigger>
                <TabsTrigger value='uncategorized'>Uncategorized</TabsTrigger>
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label='Transaction view' variant='outline' className='@min-[32rem]/toolbar:hidden'>
                  {search.uncategorized ? 'Uncategorized' : 'All'} <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuRadioGroup
                  value={search.uncategorized ? 'uncategorized' : 'all'}
                  onValueChange={(value) =>
                    navigate({
                      search: (previous) => ({
                        ...previous,
                        page: undefined,
                        uncategorized: value === 'uncategorized' || undefined,
                      }),
                    })
                  }
                >
                  <DropdownMenuRadioItem value='all'>All transactions</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='uncategorized'>Uncategorized</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label='More actions' title='More actions' size='icon' variant='outline'>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem asChild>
                  <Link to='/finances/imports'>
                    <Upload /> Import CSV
                  </Link>
                </DropdownMenuItem>
                <TransactionExportMenuItem filters={toFilters(search)} />
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <PageAddButton
                  disabled={!canRecord}
                  title={canRecord ? undefined : 'Your role in this space does not allow recording transactions'}
                >
                  Add transaction
                </PageAddButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add transaction</DialogTitle>
                  <DialogDescription>Record a booking by hand.</DialogDescription>
                </DialogHeader>
                <TransactionForm onClose={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      >
        <div className='hidden items-center gap-2 @min-[60rem]/toolbar:flex'>{filterControls(true)}</div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-label='Filters'
              title='Filters'
              variant='outline'
              className='size-9 p-0 @min-[32rem]/toolbar:w-auto @min-[32rem]/toolbar:px-3 @min-[60rem]/toolbar:hidden'
            >
              <SlidersHorizontal />
              <span className='sr-only @min-[32rem]/toolbar:not-sr-only'>Filters</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-96 max-w-[calc(100vw-2rem)]'>
            <div className='flex flex-col items-start gap-3'>{filterControls(false)}</div>
          </PopoverContent>
        </Popover>
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
