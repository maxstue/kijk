import { createFileRoute } from '@tanstack/react-router';

import { ImportList } from '@/app/imports/import-list';
import { ImportSettingsCard } from '@/app/imports/settings-card';
import { ImportUploadForm } from '@/app/imports/upload-form';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { importSettingsQueryOptions, importsQueryOptions } from '@/shared/api/imports/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

/** `/imports`: upload bank exports and see recent imports. */
export const Route = createFileRoute('/_authenticated/_app/imports/')({
  component: ImportsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(importsQueryOptions()),
      queryClient.ensureQueryData(accountsQueryOptions()),
      queryClient.ensureQueryData(importSettingsQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportsPage() {
  useSetSiteHeader('Imports');

  return (
    <div className='space-y-6 pt-10'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Imports</h2>
        <p className='text-muted-foreground'>Bring your bank transactions into Kijk from CSV exports.</p>
      </div>
      <ImportUploadForm />
      <ImportList />
      <ImportSettingsCard />
    </div>
  );
}
