import { apiClient } from '@/shared/lib/api-client';
import { unwrapApiResponse } from '@/shared/utils/http';

import type { UpdateUserData, WelcomeUserData } from './types';

export async function signInUser(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/users/sign-in', { signal }));
}

export async function getCurrentUser(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/users/me', { signal }));
}

export async function updateUser(data: UpdateUserData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/users', {
      body: {
        analyticsConsent: data.analyticsConsent ?? null,
        householdName: data.householdName ?? null,
        useDefaultResources: data.useDefaultResources ?? null,
        useExternalProfile: data.useExternalProfile ?? null,
        userName: data.userName ?? null,
      },
    }),
  );
}

export async function welcomeUser(data: WelcomeUserData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/users/welcome', {
      body: {
        analyticsConsent: data.analyticsConsent,
        displayName: data.displayName,
        householdName: data.householdName,
        useDefaultResources: data.useDefaultResources,
        useExternalProfile: data.useExternalProfile,
      },
    }),
  );
}
