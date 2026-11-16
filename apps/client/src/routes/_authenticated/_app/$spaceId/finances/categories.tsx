import * as categoriesOptions from '@kijk/api/categories/options';
import * as categoryRulesOptions from '@kijk/api/category-rules/options';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { Sparkles, Tags } from 'lucide-react';
import { z } from 'zod';

import { categorySort } from '@/app/categories/columns';
import { CategoryCreateButton } from '@/app/categories/create-button';
import { CategoryRulesSection, ruleSort } from '@/app/categories/rules';
import { CategoriesSection } from '@/app/categories/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { tableSearchSchema, toTableQuery } from '@/shared/lib/table-query';
import type { TableSearch } from '@/shared/lib/table-query';

const categoryTabs = ['categories', 'rules'] as const;

/**
 * The finances categories route, which shows the categories and categorization rules of the active space. Both tabs
 * share one table URL state; switching tabs starts the other table at its first page.
 */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/categories')({
  validateSearch: tableSearchSchema.extend({
    tab: z.enum(categoryTabs).default('categories').catch('categories'),
  }),
  search: {
    middlewares: [
      // Each tab has its own initial sort; only the shared page and search defaults are left out of the URL.
      stripSearchParams({ page: 1, search: '', tab: 'categories' }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ params: { spaceId }, context: { queryClient }, deps: { tab, ...search } }) => {
    await (tab === 'rules'
      ? queryClient.query({
          ...categoryRulesOptions.listQueryOptions(spaceId, toTableQuery(ruleSort, search)),
          staleTime: 'static',
        })
      : queryClient.query({
          ...categoriesOptions.listQueryOptions(spaceId, toTableQuery(categorySort, search)),
          staleTime: 'static',
        }));
  },
  component: CategoriesPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Categories' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function CategoriesPage() {
  const { tab, ...search } = Route.useSearch();
  const navigate = Route.useNavigate();
  const onSearchChange = (change: Partial<TableSearch>, options?: { replace?: boolean }) =>
    void navigate({ search: (previous) => ({ ...previous, ...change }), replace: options?.replace });
  return (
    <div data-guide='categories' className='space-y-6 pt-6'>
      <Tabs
        value={tab}
        onValueChange={(next) => {
          const nextTab = categoryTabs.find((item) => item === next);
          if (nextTab) {
            void navigate({ search: { tab: nextTab } });
          }
        }}
        className='gap-6'
      >
        <PageToolbar>
          <PageToolbarControls>
            <TabsList aria-label='Category management' className='w-full sm:w-fit'>
              <TabsTrigger value='categories'>
                <Tags /> Categories
              </TabsTrigger>
              <TabsTrigger value='rules'>
                <Sparkles /> Categorization rules
              </TabsTrigger>
            </TabsList>
          </PageToolbarControls>
          <PageToolbarActions>
            <CategoryCreateButton />
          </PageToolbarActions>
        </PageToolbar>
        <TabsContent value='categories'>
          <CategoriesSection search={search} onSearchChange={onSearchChange} />
        </TabsContent>
        <TabsContent value='rules'>
          <CategoryRulesSection search={search} onSearchChange={onSearchChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
