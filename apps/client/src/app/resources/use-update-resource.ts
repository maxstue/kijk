import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { updateResourceMutationOptions } from '@/shared/api/resources/options';

/** Updates a resource and refreshes resource and consumption queries. */
export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateResourceMutationOptions(),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.resources.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.consumptions.all }),
      ]);
    },
  });
};
