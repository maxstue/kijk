import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/app';
import type { Years } from '@/app/budget/types';

export const getYears = queryOptions({
  queryKey: ['transactions', 'years'],
  queryFn: () =>
    apiClient.get<ApiResponse<Years>>({
      url: 'transactions/years',
    }),
});

export const useGetYears = () => useSuspenseQuery(getYears);
