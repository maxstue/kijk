import { apiClient } from '@/shared/lib/api-client';
import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import type { ApiResponse, AppUser } from '@/shared/types/app';

const ENDPOINT = 'users';

export function signInUser(signal?: AbortSignal) {
  return apiClient.get<ApiResponse<AppUser>>({ url: `${ENDPOINT}/sign-in`, signal });
}

export function updateUser(data: UserUpdateFormValues) {
  return apiClient.put<ApiResponse<AppUser>>({
    url: ENDPOINT,
    data: { userName: data.userName, useDefaultCategories: data.useDefaultCategories },
  });
}
