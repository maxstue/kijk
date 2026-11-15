import * as categoriesOptions from '@kijk/api/categories/options';
import * as categoryRulesOptions from '@kijk/api/category-rules/options';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { createFileRoute } from '@tanstack/react-router';
import { Sparkles, Tags } from 'lucide-react';
import { z } from 'zod';

import { categorySort } from '@/app/categories/columns';
import { CategoryCreateButton } from '@/app/categories/create-button';
import { CategoryRulesSection, ruleSort } from '@/app/categories/rules';
import { CategoriesSection } from '@/app/categories/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { toTableQuery, tableSearchSchema, fromTableSearch, toTableSearch } from '@/shared/lib/table-query';

/** The finances categories route, which shows the categories and categorization rules of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/categories')({
  validateSearch: tableSearchSchema.extend({
    tab: z.enum(['categories', 'rules']).default('categories').catch('categories'),
    rulesPage: z.coerce.number().int().min(1).max(2147483647).default(1).catch(1),
    rulesSearch: z.string().trim().max(200).default('').catch(''),
    rulesSort: z.string().max(100).optional().catch(undefined),
    rulesDescending: z.boolean().optional().catch(undefined),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params: { spaceId }, context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.query({
        ...categoriesOptions.listQueryOptions(spaceId, toTableQuery(categorySort, fromTableSearch(categorySort, deps))),
        staleTime: 'static',
      }),
      queryClient.query({
        ...categoryRulesOptions.listQueryOptions(
          spaceId,
          toTableQuery(
            ruleSort,
            fromTableSearch(ruleSort, {
              page: deps.rulesPage,
              search: deps.rulesSearch,
              sort: deps.rulesSort,
              descending: deps.rulesDescending,
            }),
          ),
        ),
        staleTime: 'static',
      }),
    ]);
  },
  component: CategoriesPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Categories' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function CategoriesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div data-guide='categories' className='space-y-6 pt-6'>
      <Tabs
        value={search.tab}
        onValueChange={(tab) => {
          if (tab === 'categories' || tab === 'rules') {
            void navigate({ search: (previous) => ({ ...previous, tab }) });
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
          <CategoriesSection
            state={fromTableSearch(categorySort, search)}
            onStateChange={(state, options) =>
              void navigate({
                search: (previous) => ({ ...previous, ...toTableSearch(state) }),
                replace: options?.replace,
              })
            }
          />
        </TabsContent>
        <TabsContent value='rules'>
          <CategoryRulesSection
            state={fromTableSearch(ruleSort, {
              page: search.rulesPage,
              search: search.rulesSearch,
              sort: search.rulesSort,
              descending: search.rulesDescending,
            })}
            onStateChange={(state, options) => {
              const next = toTableSearch(state);
              void navigate({
                search: (previous) => ({
                  ...previous,
                  rulesPage: next.page,
                  rulesSearch: next.search,
                  rulesSort: next.sort,
                  rulesDescending: next.descending,
                }),
                replace: options?.replace,
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
