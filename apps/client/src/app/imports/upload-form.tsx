import * as accountsOptions from '@kijk/api/accounts/options';
import * as importsOptions from '@kijk/api/imports/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { UploadAccountSelect } from './upload-account-select';
import { UploadConsent } from './upload-consent';

const maxFileBytes = 5 * 1024 * 1024;

/** Card for uploading a bank export into one of the space's bank accounts. */
export function ImportUploadForm() {
  const spaceId = useSpaceId();
  const canImport = useSpacePermission(SpacePermissions.finances.import);
  const { data: accounts } = useSuspenseQuery(accountsOptions.listQueryOptions(spaceId));
  const bankAccounts = accounts.filter((account) => account.kind === 'Bank');
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? '');
  const [file, setFile] = useState<File>();
  const [consentChecked, setConsentChecked] = useState(false);
  const { data: currentUser } = useQuery(usersOptions.meQueryOptions());
  const hasConsent = Boolean(currentUser?.user?.sensitiveDataConsentAt);
  const consentMutation = useMutation(usersOptions.updateMutationOptions());
  const createMutation = useMutation(importsOptions.startMutationOptions(spaceId));
  const navigate = useNavigate();
  const fileId = useId();
  const isPending = consentMutation.isPending || createMutation.isPending;

  function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !accountId) {
      return;
    }
    if (file.size > maxFileBytes) {
      toast.error('File too large', { description: 'Bank exports can be at most 5 MB.' });
      return;
    }
    const upload = (selected: File) =>
      createMutation.mutate(
        { accountId, file: selected },
        {
          onError: (error) => toast.error(error.name, { description: error.message }),
          onSuccess: (job) =>
            void navigate({
              params: { spaceId: spaceId, importId: job.id },
              to: '/$spaceId/finances/imports/$importId',
            }),
        },
      );
    if (hasConsent) {
      upload(file);
      return;
    }
    if (!consentChecked) {
      return;
    }
    consentMutation.mutate(
      { sensitiveDataConsent: true },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => upload(file),
      },
    );
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        {bankAccounts.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            <Link
              className='underline underline-offset-4'
              params={{ spaceId: spaceId }}
              to='/$spaceId/finances/accounts'
            >
              Add a bank account
            </Link>{' '}
            before starting an import.
          </p>
        ) : (
          <form className='grid gap-6' onSubmit={onSubmit}>
            <UploadAccountSelect accounts={bankAccounts} accountId={accountId} onChange={setAccountId} />
            <div className='grid gap-2'>
              <Label htmlFor={fileId}>CSV file</Label>
              <p className='text-muted-foreground text-xs'>
                Choose the CSV export downloaded from your bank. Maximum 5 MB.
              </p>
              <Input
                accept='.csv,text/csv'
                id={fileId}
                type='file'
                onChange={(event) => setFile(event.target.files?.[0])}
              />
            </div>
            {hasConsent ? null : <UploadConsent checked={consentChecked} onChange={setConsentChecked} />}
            <div className='flex flex-wrap items-center justify-between gap-4 border-t pt-4'>
              <p className='text-muted-foreground text-sm'>You review the transactions before saving.</p>
              <Button disabled={!canImport || !file || (!hasConsent && !consentChecked) || isPending} type='submit'>
                {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : <Upload />}
                {isPending ? 'Uploading…' : 'Continue to columns'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
