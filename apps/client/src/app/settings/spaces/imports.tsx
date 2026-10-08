import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Switch } from '@kijk/ui/components/switch';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { toast } from 'sonner';

import { aiDataSharingLabels, purposeRetentionLabels } from '@/shared/api/imports/constants';
import { importSettingsQueryOptions, updateImportSettingsMutationOptions } from '@/shared/api/imports/options';
import type { AiDataSharing, ImportSettings, PurposeRetention } from '@/shared/api/imports/types';
import { queryKeys } from '@/shared/api/query-keys';
import { SpacePermissions, hasSpacePermission } from '@/shared/api/spaces/permissions';
import { currentUserQueryOptions } from '@/shared/api/users/options';

import { SpaceBackLink } from './back-link';
import { useSpaceSettings } from './context';

const retentions = Object.keys(purposeRetentionLabels) as PurposeRetention[];
const sharingLevels = Object.keys(aiDataSharingLabels) as AiDataSharing[];

/** Cards for choosing how much of the purpose text imported transactions keep and what the AI may see. */
export function SpaceImportSettings() {
  const { space } = useSpaceSettings();
  const canConfigure = hasSpacePermission(space, SpacePermissions.finances.configure);
  const { data } = useSuspenseQuery(importSettingsQueryOptions(space.id));
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    ...updateImportSettingsMutationOptions(space.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.imports.settings() }),
  });
  const retentionId = useId();
  const sharingId = useId();
  const minimizeId = useId();
  const aiEnabled = currentUser?.user?.aiEnabled ?? false;

  function save(change: Partial<Pick<ImportSettings, 'aiDataSharing' | 'minimizeData' | 'purposeRetention'>>) {
    updateMutation.mutate(
      {
        aiDataSharing: data.aiDataSharing,
        minimizeData: data.minimizeData,
        purposeRetention: data.purposeRetention,
        ...change,
      },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => toast.success('Import settings saved'),
      },
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <SpaceBackLink />
      <Card>
        <CardHeader>
          <CardTitle>Import settings</CardTitle>
          <CardDescription>Defaults for new bank imports in {space.name}.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor={retentionId}>Purpose text</Label>
            <p className='text-muted-foreground text-sm'>
              IBANs, card and reference numbers are always removed. Choose how much of the remaining text new imports
              keep.
            </p>
            <Select
              disabled={!canConfigure || updateMutation.isPending}
              value={data.purposeRetention}
              onValueChange={(value) => save({ purposeRetention: value as PurposeRetention })}
            >
              <SelectTrigger className='w-full sm:w-80' id={retentionId}>
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
          </div>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <Label htmlFor={minimizeId}>Store as little as possible</Label>
              <p className='text-muted-foreground text-sm'>
                New imports replace names of private persons with [PERSON] before saving and keep no key of the
                counterparty&apos;s IBAN. Remembered categories then only work for merchants and keywords, not for
                people. Transactions imported earlier stay as they are.
              </p>
            </div>
            <Switch
              checked={data.minimizeData}
              disabled={!canConfigure || updateMutation.isPending}
              id={minimizeId}
              onCheckedChange={(checked) => save({ minimizeData: checked })}
            />
          </div>
          {aiEnabled && (
            <div className='space-y-2'>
              <Label htmlFor={sharingId}>AI categorization</Label>
              <p className='text-muted-foreground text-sm'>
                With Strict, every import review offers to send the counterparty and the purpose of transactions without
                a category to the AI provider, after IBANs, reference numbers, e-mail addresses and the names of private
                persons are replaced. You see exactly what would be sent and start it yourself. Amounts, dates and
                account numbers never leave the server.
              </p>
              <Select
                disabled={!canConfigure || updateMutation.isPending}
                value={data.aiDataSharing}
                onValueChange={(value) => save({ aiDataSharing: value as AiDataSharing })}
              >
                <SelectTrigger className='w-full sm:w-96' id={sharingId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sharingLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {aiDataSharingLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
