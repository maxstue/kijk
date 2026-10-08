import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { createFileRoute } from '@tanstack/react-router';
import { Sparkles, Tags } from 'lucide-react';

import { CategoryCreateButton } from '@/app/categories/create-button';
import { CategoryRulesSection } from '@/app/categories/rules';
import { CategoriesSection } from '@/app/categories/section';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { categoryRulesQueryOptions } from '@/shared/api/category-rules/options';
import { AppError } from '@/shared/components/errors/app-error';
import { PageToolbar } from '@/shared/components/page-header';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

/** The finances categories route, which shows the categories and categorization rules of the active space. */
export const Route = createFileRoute('/_authenticated/_app/finances/categories')({
  component: CategoriesPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.query({ ...categoriesQueryOptions(), staleTime: 'static' }),
      queryClient.query({ ...categoryRulesQueryOptions(), staleTime: 'static' }),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function CategoriesPage() {
  useSetSiteHeader('Categories');

  return (
    <div className='space-y-6 pt-6'>
      <Tabs defaultValue='categories' className='gap-6'>
        <PageToolbar
          actions={<CategoryCreateButton />}
          tabs={
            <TabsList aria-label='Category management' className='w-full sm:w-fit'>
              <TabsTrigger value='categories'>
                <Tags /> Categories
              </TabsTrigger>
              <TabsTrigger value='rules'>
                <Sparkles /> Categorization rules
              </TabsTrigger>
            </TabsList>
          }
        />
        <TabsContent value='categories'>
          <CategoriesSection />
        </TabsContent>
        <TabsContent value='rules'>
          <CategoryRulesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
