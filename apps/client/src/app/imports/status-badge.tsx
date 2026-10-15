import type { ImportJobStatus } from '@kijk/api/imports/types';
import { Badge } from '@kijk/ui/components/badge';

import { importStatusLabels } from '@/app/imports/constants';

const variants: Record<ImportJobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Analyzing: 'secondary',
  Categorizing: 'secondary',
  Cancelled: 'outline',
  Done: 'default',
  Failed: 'destructive',
  NeedsMapping: 'secondary',
  NeedsReview: 'secondary',
  Pending: 'secondary',
  Reading: 'secondary',
};

/** Badge with the label of an import state. */
export function ImportStatusBadge({ status }: { status: ImportJobStatus }) {
  return <Badge variant={variants[status]}>{importStatusLabels[status]}</Badge>;
}
