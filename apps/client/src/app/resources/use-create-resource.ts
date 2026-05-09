import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';
import { createResourceMutationOptions } from '@/shared/api/resources/options';

export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...createResourceMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
    },
  });
};
