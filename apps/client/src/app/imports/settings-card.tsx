import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { purposeRetentionLabels } from '@/app/imports/constants';
import { useUpdateImportSettings } from '@/app/imports/use-import-mutations';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { importSettingsQueryOptions } from '@/shared/api/imports/options';
import type { PurposeRetention } from '@/shared/api/imports/types';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';

const retentions = Object.keys(purposeRetentionLabels) as PurposeRetention[];

/** Card for choosing how much of the purpose text imported transactions keep. */
export function ImportSettingsCard() {
  const canConfigure = useHouseholdPermission(HouseholdPermissions.finances.configure);
  const { data } = useSuspenseQuery(importSettingsQueryOptions());
  const updateMutation = useUpdateImportSettings();

  function onChange(value: string) {
    updateMutation.mutate(value as PurposeRetention, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: () => toast.success('Import settings saved'),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purpose text</CardTitle>
        <CardDescription>
          IBANs, card and reference numbers are always removed. Choose how much of the remaining text new imports keep.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          disabled={!canConfigure || updateMutation.isPending}
          value={data.purposeRetention}
          onValueChange={onChange}
        >
          <SelectTrigger className='w-full sm:w-80'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {retentions.map((retention) => (
              <SelectItem key={retention} value={retention}>
                {purposeRetentionLabels[retention]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
