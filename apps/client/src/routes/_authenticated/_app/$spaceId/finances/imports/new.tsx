import * as accountsOptions from '@kijk/api/accounts/options';
import { createFileRoute } from '@tanstack/react-router';

import { ImportUploadForm } from '@/app/imports/upload-form';
import { ImportWizard } from '@/app/imports/wizard';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/imports/new')({
  loader: ({ params: { spaceId }, context: { queryClient } }) =>
    queryClient.query({ ...accountsOptions.listQueryOptions(spaceId), staleTime: 'static' }),
  component: NewImportPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'New import' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function NewImportPage() {
  return (
    <ImportWizard
      currentStep={0}
      title='Choose your bank export'
      description='Select an account and a CSV file to start. Next, we’ll help you check its columns.'
    >
      <ImportUploadForm />
    </ImportWizard>
  );
}
