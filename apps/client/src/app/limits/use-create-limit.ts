import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createLimitMutationOptions } from '@/shared/api/limits/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Creates a limit and refreshes the limit queries. */
export function useCreateLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createLimitMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.limits.all });
    },
  });
}
