import { createFileRoute } from '@tanstack/react-router';

import { ResourceTypesSection } from '@/app/resources/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_protected/resources')({
  component: ResourcesPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ResourcesPage() {
  useSetSiteHeader('Resources');

  return (
    <div className='space-y-6 pt-10'>
      <ResourceTypesSection />
    </div>
  );
}
