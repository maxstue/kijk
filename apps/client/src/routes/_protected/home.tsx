import { createFileRoute } from '@tanstack/react-router';

import { Suspense } from 'react';
import { AppError } from '@/shared/components/errors/app-error';
import { HomeSectionCards } from '@/app/home/home-section-cards';
import { HomeTable } from '@/app/home/home-table';
import { HomeChartArea } from '@/app/home/home-chart-area';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';

export const Route = createFileRoute('/_protected/home')({
  component: HomeIndexPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
});

function HomeIndexPage() {
  useSetSiteHeader('Home');
  return (
    <>
      <div className='@container/main flex flex-1 flex-col gap-2'>
        <div className='flex flex-col gap-4'>
          <HomeSectionCards />
          <div>
            <Suspense fallback={<AsyncLoader className='h-6 w-6' />}>
              <HomeChartArea />
            </Suspense>
          </div>
          <Suspense fallback={<AsyncLoader className='h-6 w-6' />}>
            <HomeTable />
          </Suspense>
        </div>
      </div>
    </>
  );
}
