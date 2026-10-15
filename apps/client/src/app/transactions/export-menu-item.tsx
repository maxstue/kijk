import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { exportTransactions } from '@kijk/api/transactions/requests';
import type { TransactionFilters } from '@kijk/api/transactions/types';
import { DropdownMenuItem } from '@kijk/ui/components/dropdown-menu';
import { useMutation } from '@tanstack/react-query';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { saveDownload } from '@/shared/utils/download';

/** Downloads the transactions matching `filters` as CSV. */
export function TransactionExportMenuItem({ filters }: { filters: TransactionFilters }) {
  const spaceId = useSpaceId();
  const canExport = useSpacePermission(SpacePermissions.finances.export);
  const exportMutation = useMutation({
    mutationFn: () => exportTransactions(spaceId, filters),
    onError: (error) => toast.error('Export failed', { description: error.message }),
    onSuccess: saveDownload,
  });

  return (
    <DropdownMenuItem
      disabled={!canExport || exportMutation.isPending}
      title={canExport ? undefined : 'Your role in this space does not allow exporting transactions'}
      onClick={() => exportMutation.mutate()}
    >
      {exportMutation.isPending ? <LoaderCircleIcon className='animate-spin' /> : <DownloadIcon />}
      Export CSV
    </DropdownMenuItem>
  );
}
