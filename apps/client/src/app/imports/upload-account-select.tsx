import type { Account } from '@kijk/api/accounts/types';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

import { accountLabel } from '@/shared/utils/format';
interface UploadAccountSelectProps {
  accounts: Account[];
  accountId: string;
  onChange: (accountId: string) => void;
}
export function UploadAccountSelect({ accounts, accountId, onChange }: UploadAccountSelectProps) {
  return (
    <div className='grid gap-2'>
      <Label>Bank account</Label>
      <Select
        items={accounts.map((account) => ({ label: accountLabel(account), value: account.id }))}
        value={accountId}
        onValueChange={(next) => onChange(next ?? '')}
      >
        <SelectTrigger aria-label='Bank account' className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {accountLabel(account)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
