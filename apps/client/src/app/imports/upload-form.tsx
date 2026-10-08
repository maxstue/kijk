import { Button } from '@kijk/ui/components/button';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useCreateImport, useGiveSensitiveDataConsent } from '@/app/imports/use-import-mutations';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

const maxFileBytes = 5 * 1024 * 1024;

/** Card for uploading a bank export into one of the space's bank accounts. */
export function ImportUploadForm() {
  const canImport = useSpacePermission(SpacePermissions.finances.import);
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions());
  const bankAccounts = accounts.filter((account) => account.kind === 'Bank');
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? '');
  const [file, setFile] = useState<File>();
  const [consentChecked, setConsentChecked] = useState(false);
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const hasConsent = Boolean(currentUser?.user?.sensitiveDataConsentAt);
  const consentMutation = useGiveSensitiveDataConsent();
  const createMutation = useCreateImport();
  const navigate = useNavigate();
  const fileId = useId();
  const consentId = useId();
  const isPending = consentMutation.isPending || createMutation.isPending;

  function onSubmit(event: React.FormEvent) {
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
          onSuccess: (job) => void navigate({ params: { importId: job.id }, to: '/finances/imports/$importId' }),
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
            <Link className='underline underline-offset-4' to='/finances/accounts'>
              Add a bank account
            </Link>{' '}
            before starting an import.
          </p>
        ) : (
          <form className='grid gap-6' onSubmit={onSubmit}>
            <div className='grid gap-2'>
              <Label>Bank account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger aria-label='Bank account' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.ibanLast4 ? ` (…${account.ibanLast4})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            {hasConsent ? null : (
              <div className='flex items-start gap-3 rounded border p-4'>
                <Checkbox
                  checked={consentChecked}
                  id={consentId}
                  onCheckedChange={(checked) => setConsentChecked(checked === true)}
                />
                <Label className='block text-sm leading-relaxed font-normal' htmlFor={consentId}>
                  I explicitly consent to Kijk storing and processing my bank transactions, although they can reveal
                  sensitive information, for example about my health, religion, political opinions or union membership
                  (GDPR Article 9(2)(a)). I can withdraw this consent at any time in Settings → Info; Kijk then no
                  longer imports bank exports for me.{' '}
                  <a
                    className='text-foreground underline underline-offset-4'
                    href='/privacy'
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    Privacy Policy
                  </a>
                </Label>
              </div>
            )}
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
