import { Button } from '@kijk/ui/components/button';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { exportConsumption, exportConsumptionMonth } from '@/shared/api/consumptions/requests';
import type { Months } from '@/shared/utils/months';

type Props =
  | { consumptionId: string; disabled?: never; month?: never; year?: never }
  | { consumptionId?: never; disabled?: boolean; month: Months; year: number };

export function ConsumptionExportButton(props: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const isSingleExport = props.consumptionId !== undefined;
  const label = isSingleExport ? 'Export consumption' : 'Export monthly consumptions';

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const download = isSingleExport
        ? await exportConsumption(props.consumptionId)
        : await exportConsumptionMonth(props.year, props.month);
      const url = URL.createObjectURL(download.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = download.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Export failed', { description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      aria-label={label}
      disabled={isExporting || props.disabled}
      onClick={handleExport}
      size={isSingleExport ? 'icon' : 'default'}
      variant='outline'
    >
      {isExporting ? <LoaderCircleIcon className='size-4 animate-spin' /> : <DownloadIcon className='size-4' />}
      {isSingleExport ? undefined : 'Export CSV'}
    </Button>
  );
}
