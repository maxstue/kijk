import { apiClient } from '@/shared/lib/api-client';
import { unwrapApiResponse } from '@/shared/utils/http';

import type { UpdateUserData, WelcomeUserData } from './types';

export async function signInUser(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/users/sign-in', { signal }));
}

export async function updateUser(data: UpdateUserData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/users', {
      body: { useDefaultResources: data.useDefaultResources ?? null, userName: data.userName ?? null },
    }),
  );
}

export async function welcomeUser(data: WelcomeUserData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/users/welcome', {
      body: { useDefaultResources: data.useDefaultResources ?? null, userName: data.userName ?? null },
    }),
  );
}
