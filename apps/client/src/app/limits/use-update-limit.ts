import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateLimitMutationOptions } from '@/shared/api/limits/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Updates a limit and refreshes the limit queries. */
export function useUpdateLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateLimitMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.limits.all });
    },
  });
}
