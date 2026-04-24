import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createResource } from '@/shared/api/resources';
import type { ApiError, Resource } from '@/shared/types/app';

import type { ResourceFormValues } from './schemas';

interface Options {
  resourceType: ResourceFormValues;
}

export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation<Resource, ApiError, Options>({
    mutationFn: (data: Options) => createResource(data.resourceType),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};
