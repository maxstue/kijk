import { queryKeys } from '@kijk/api/query-keys';
import { queryOptions } from '@tanstack/react-query';

import { list } from './requests';

/** Query for the system unit catalog, which only changes with a release. */
export const listQueryOptions = () =>
  queryOptions({ queryFn: ({ signal }) => list(signal), queryKey: queryKeys.units.list(), staleTime: Infinity });
