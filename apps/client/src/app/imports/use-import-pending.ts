import type { ImportJob } from '@kijk/api/imports/types';
import { queryKeys } from '@kijk/api/query-keys';
import { useIsMutating } from '@tanstack/react-query';

import { useSpaceId } from '@/shared/hooks/use-active-space';

/** Includes row edits and their cache refreshes before allowing another import operation. */
export function useImportPending(job: Pick<ImportJob, 'id' | 'status'>) {
  const spaceId = useSpaceId();
  const pending = useIsMutating({ mutationKey: queryKeys.imports.mutations(spaceId, job.id) });
  return pending > 0 || job.status === 'Categorizing';
}
