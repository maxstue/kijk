import { Button } from '@kijk/ui/components/button';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { exportConsumption, exportConsumptionMonth } from '@/shared/api/consumptions/requests';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { saveDownload } from '@/shared/utils/download';
import type { Months } from '@/shared/utils/months';

type Props =
  | { consumptionId: string; disabled?: never; month?: never; year?: never }
  | { consumptionId?: never; disabled?: boolean; month: Months; year: number };

/** Downloads a single consumption (`consumptionId`) or a whole month (`year` + `month`) as CSV. */
export function ConsumptionExportButton(props: Props) {
  const canExport = useSpacePermission(SpacePermissions.consumptions.export);
  const [isExporting, setIsExporting] = useState(false);
  const isSingleExport = props.consumptionId !== undefined;
  const label = isSingleExport ? 'Export consumption' : 'Export monthly consumptions';

  const handleExport = async () => {
    if (!canExport) {
      return;
    }
    setIsExporting(true);
    try {
      const download = isSingleExport
        ? await exportConsumption(props.consumptionId)
        : await exportConsumptionMonth(props.year, props.month);
      saveDownload(download);
    } catch (error) {
      toast.error('Export failed', { description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsExporting(false);
    }
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
