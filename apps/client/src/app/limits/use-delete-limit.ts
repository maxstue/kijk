import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteLimitMutationOptions } from '@/shared/api/limits/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Deletes a limit and refreshes the limit queries. */
export function useDeleteLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteLimitMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.limits.all });
    },
  });
}
