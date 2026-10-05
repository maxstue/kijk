import { Button } from '@kijk/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { exportTransactions } from '@/shared/api/transactions/requests';
import type { TransactionFilters } from '@/shared/api/transactions/types';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';
import { saveDownload } from '@/shared/utils/download';

/** Downloads the transactions matching `filters` as CSV. */
export function TransactionExportButton({ filters }: { filters: TransactionFilters }) {
  const canExport = useHouseholdPermission(HouseholdPermissions.finances.export);
  const exportMutation = useMutation({
    mutationFn: () => exportTransactions(filters),
    onError: (error) => toast.error('Export failed', { description: error.message }),
    onSuccess: saveDownload,
  });

  return (
    <Button
      disabled={!canExport || exportMutation.isPending}
      title={canExport ? undefined : 'Your household role does not allow exporting transactions'}
      variant='outline'
      onClick={() => exportMutation.mutate()}
    >
      {exportMutation.isPending ? (
        <LoaderCircleIcon className='size-4 animate-spin' />
      ) : (
        <DownloadIcon className='size-4' />
      )}
      Export CSV
    </Button>
  );
}
