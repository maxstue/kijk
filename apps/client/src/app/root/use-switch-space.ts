import { switchSpaceMutationOptions } from '@kijk/api/users/options';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

/** Switches the active space and reloads everything that belongs to the previous one. */
export function useSwitchSpace() {
  const router = useRouter();
  const options = switchSpaceMutationOptions();

  return useMutation({
    ...options,
    async onSuccess(...args) {
      await options.onSuccess?.(...args);
      await router.invalidate();
    },
  });
}
