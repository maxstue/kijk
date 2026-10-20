import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Button } from '@kijk/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { saveDownload } from '@/shared/utils/download';
import type { Months } from '@/shared/utils/months';

type Props =
  | { consumptionId: string; disabled?: never; month?: never; year?: never }
  | { consumptionId?: never; disabled?: boolean; month: Months; year: number };

/** Downloads a single consumption (`consumptionId`) or a whole month (`year` + `month`) as CSV. */
export function ConsumptionExportButton(props: Props) {
  const spaceId = useSpaceId();
  const canExport = useSpacePermission(SpacePermissions.consumptions.export);
  const exportMutation = useMutation({
    ...consumptionsOptions.exportMutationOptions(spaceId),
    onSuccess: saveDownload,
    onError: (error) => toast.error('Export failed', { description: error.message }),
  });
  const isExporting = exportMutation.isPending;
  const isSingleExport = props.consumptionId !== undefined;
  const label = isSingleExport ? 'Export consumption' : 'Export monthly consumptions';

  const handleExport = () => {
    if (!canExport) {
      return;
    }
    exportMutation.mutate(
      isSingleExport ? { consumptionId: props.consumptionId } : { year: props.year, month: props.month },
    );
  };

  return (
    <Button
      aria-label={label}
      disabled={!canExport || isExporting || props.disabled}
      title={canExport ? undefined : 'Your role in this space does not allow exporting consumptions'}
      onClick={handleExport}
      size={isSingleExport ? 'icon' : 'default'}
      variant='outline'
    >
      {isExporting ? <LoaderCircleIcon className='size-4 animate-spin' /> : <DownloadIcon className='size-4' />}
      {isSingleExport ? undefined : 'Export CSV'}
    </Button>
  );
}
