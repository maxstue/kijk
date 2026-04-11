import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import { apiClient } from '@/shared/lib/api-client';
import type { AppUser } from '@/shared/types/app';

const ENDPOINT = 'users';

export function signInUser(signal?: AbortSignal) {
  return apiClient.get<AppUser>({ signal, url: `${ENDPOINT}/sign-in` });
}

export function updateUser(data: UserUpdateFormValues) {
  return apiClient.put<AppUser>({
    data: { useDefaultResources: data.useDefaultResources, userName: data.userName },
    url: ENDPOINT,
  });
}
