import { aiDataSharingLabels } from '@kijk/api/imports/constants';
import * as importsOptions from '@kijk/api/imports/options';
import type { AiDataSharing, ImportSettings } from '@kijk/api/imports/types';
import { SpacePermissions, hasSpacePermission } from '@kijk/api/spaces/permissions';
import * as usersOptions from '@kijk/api/users/options';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Switch } from '@kijk/ui/components/switch';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { toast } from 'sonner';

import { useFeature } from '@/shared/hooks/use-feature';

import { SpaceBackLink } from './back-link';
import { useSpaceSettings } from './context';
import { ImportPurposeSetting } from './import-purpose-setting';

const sharingLevels = Object.keys(aiDataSharingLabels) as AiDataSharing[];

/** Cards for choosing how much of the purpose text imported transactions keep and what the AI may see. */
export function SpaceImportSettings() {
  const { space } = useSpaceSettings();
  const canConfigure = hasSpacePermission(space, SpacePermissions.finances.configure);
  const { data } = useSuspenseQuery(importsOptions.settingsQueryOptions(space.id));
  const { data: currentUser } = useQuery(usersOptions.meQueryOptions());
  const updateMutation = useMutation(importsOptions.updateSettingsMutationOptions(space.id));
  const sharingId = useId();
  const minimizeId = useId();
  const aiImport = useFeature('aiImport');
  const aiEnabled = aiImport && (currentUser?.user?.aiEnabled ?? false);

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
          <ImportPurposeSetting
            value={data.purposeRetention}
            disabled={!canConfigure || updateMutation.isPending}
            onChange={(purposeRetention) => save({ purposeRetention })}
          />
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
                items={aiDataSharingLabels}
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
