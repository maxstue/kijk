import { createFileRoute } from '@tanstack/react-router';

import { ResourceTypesSection } from '@/app/resources/section';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_authenticated/_app/resources')({
  component: ResourcesPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(resourcesQueryOptions()),
});

function ResourcesPage() {
  useSetSiteHeader('Resources');

  return (
    <div className='space-y-6 pt-10'>
      <ResourceTypesSection />
    </div>
  );
}
