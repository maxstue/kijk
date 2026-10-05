import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { queryKeys } from '@/shared/api/query-keys';
import { switchHouseholdMutationOptions } from '@/shared/api/users/options';

/** Switches the active space and reloads everything that belongs to the previous one. */
export function useSwitchSpace() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    ...switchHouseholdMutationOptions(),
    async onSuccess(currentUser) {
      queryClient.setQueryData(queryKeys.users.me, currentUser);
      // Every other query belongs to the previous space.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.users.me[0] });
      await router.invalidate();
    },
  });
}
