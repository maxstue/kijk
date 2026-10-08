import { createFileRoute } from '@tanstack/react-router';

import { ImportUploadForm } from '@/app/imports/upload-form';
import { ImportWizard } from '@/app/imports/wizard';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_authenticated/_app/finances/imports/new')({
  component: NewImportPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: ({ context: { queryClient } }) => queryClient.query({ ...accountsQueryOptions(), staleTime: 'static' }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function NewImportPage() {
  useSetSiteHeader('New import');
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
