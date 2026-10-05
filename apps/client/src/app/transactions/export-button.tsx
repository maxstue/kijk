import { Button } from '@kijk/ui/components/button';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { exportTransactions } from '@/shared/api/transactions/requests';
import type { TransactionFilters } from '@/shared/api/transactions/types';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';
import { saveDownload } from '@/shared/utils/download';

/** Downloads the transactions matching `filters` as CSV. */
export function TransactionExportButton({ filters }: { filters: TransactionFilters }) {
  const canExport = useHouseholdPermission(HouseholdPermissions.finances.export);
  const [isExporting, setIsExporting] = useState(false);

  async function onExport() {
    setIsExporting(true);
    try {
      saveDownload(await exportTransactions(filters));
    } catch (error) {
      toast.error('Export failed', { description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      disabled={!canExport || isExporting}
      title={canExport ? undefined : 'Your household role does not allow exporting transactions'}
      variant='outline'
      onClick={onExport}
    >
      {isExporting ? <LoaderCircleIcon className='size-4 animate-spin' /> : <DownloadIcon className='size-4' />}
      Export CSV
    </Button>
  );
}
