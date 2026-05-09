import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { updateResourceMutationOptions } from '@/shared/api/resources/options';

export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateResourceMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
    },
  });
};
