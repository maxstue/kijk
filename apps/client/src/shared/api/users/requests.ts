import { apiClient } from '@/shared/lib/api-client';
import { unwrapApiData } from '@/shared/utils/http';

import type { UpdateUserData, WelcomeUserData } from './types';

export async function signInUser(signal?: AbortSignal) {
  return unwrapApiData(await apiClient.GET('/api/users/sign-in', { signal }));
}

export async function updateUser(data: UpdateUserData) {
  return unwrapApiData(
    await apiClient.PUT('/api/users', {
      body: { useDefaultResources: data.useDefaultResources ?? null, userName: data.userName ?? null },
    }),
  );
}

export async function welcomeUser(data: WelcomeUserData) {
  return unwrapApiData(
    await apiClient.PUT('/api/users/welcome', {
      body: { useDefaultResources: data.useDefaultResources ?? null, userName: data.userName ?? null },
    }),
  );
}
