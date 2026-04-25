import type { UserUpdateFormValues } from '@/app/settings/profile/schemas';
import type { UserStepFormValues } from '@/app/welcome/schemas';
import { apiClient, unwrapApiResponse } from '@/shared/lib/api-client';

export function signInUser(signal?: AbortSignal) {
  return apiClient.GET('/api/users/sign-in', { signal }).then((response) => unwrapApiResponse(response));
}

export function updateUser(data: UserUpdateFormValues) {
  return apiClient
    .PUT('/api/users', {
      body: { useDefaultResources: data.useDefaultResources, userName: data.userName ?? null },
    })
    .then((response) => unwrapApiResponse(response));
}

export function welcomeUser(data: UserStepFormValues) {
  return apiClient
    .PUT('/api/users/welcome', {
      body: { useDefaultResources: data.useDefaultResources ?? null, userName: data.userName ?? null },
    })
    .then((response) => unwrapApiResponse(response));
}
