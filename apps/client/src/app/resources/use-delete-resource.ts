import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { deleteResourceMutationOptions } from '@/shared/api/resources/options';

/** Deletes a resource and refreshes the resource queries. */
export const useDeleteResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteResourceMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
    },
  });
};
