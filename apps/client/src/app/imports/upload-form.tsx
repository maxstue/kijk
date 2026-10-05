import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useCreateImport } from '@/app/imports/use-import-mutations';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';

const maxFileBytes = 5 * 1024 * 1024;

/** Card for uploading a bank export into one of the household's bank accounts. */
export function ImportUploadForm() {
  const canImport = useHouseholdPermission(HouseholdPermissions.finances.import);
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions());
  const bankAccounts = accounts.filter((account) => account.kind === 'Bank');
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? '');
  const [file, setFile] = useState<File>();
  const createMutation = useCreateImport();
  const navigate = useNavigate();
  const fileId = useId();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !accountId) {
      return;
    }
    if (file.size > maxFileBytes) {
      toast.error('File too large', { description: 'Bank exports can be at most 5 MB.' });
      return;
    }
    createMutation.mutate(
      { accountId, file },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: (job) => void navigate({ params: { importId: job.id }, to: '/imports/$importId' }),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import a bank export</CardTitle>
        <CardDescription>
          Upload the CSV export of a bank account. Each month the file covers completely replaces that account&apos;s
          transactions of the month, so importing overlapping exports never counts anything twice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bankAccounts.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Add a bank account on the transactions page first.</p>
        ) : (
          <form className='grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end' onSubmit={onSubmit}>
            <div className='grid gap-2'>
              <Label>Bank account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className='w-full'>
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
              <Input
                accept='.csv,text/csv'
                id={fileId}
                type='file'
                onChange={(event) => setFile(event.target.files?.[0])}
              />
            </div>
            <Button disabled={!canImport || !file || createMutation.isPending} type='submit'>
              {createMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : <Upload />} Upload
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
