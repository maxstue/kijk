import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { UpdateUserData, WelcomeUserData } from './types';

/** Loads the current account state. */
export async function getCurrentUser(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/users/me', { signal }));
}

/** Updates the user's settings; omitted values stay unchanged. */
export async function updateUser(data: UpdateUserData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/users', {
      body: {
        aiEnabled: data.aiEnabled ?? null,
        analyticsConsent: data.analyticsConsent ?? null,
        sensitiveDataConsent: data.sensitiveDataConsent ?? null,
        spaceName: data.spaceName ?? null,
        useDefaultResources: data.useDefaultResources ?? null,
        useExternalProfile: data.useExternalProfile ?? null,
        userName: data.userName ?? null,
      },
    }),
  );
}

/** Completes onboarding and creates the account and first space if needed. */
export async function welcomeUser(data: WelcomeUserData) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/users/onboarding', {
      body: {
        analyticsConsent: data.analyticsConsent,
        displayName: data.displayName,
        spaceName: data.spaceName,
        useDefaultResources: data.useDefaultResources,
        useExternalProfile: data.useExternalProfile,
      },
    }),
  );
}

/** Switches the active space; every other request works on the active space. */
export async function switchSpace(spaceId: string) {
  return unwrapApiResponse(await apiClient.PUT('/api/users/active-space', { body: { spaceId } }));
}

/** Starts deleting the current user's account and all their data in the background. */
export async function requestAccountDeletion() {
  return ensureApiSuccess(await apiClient.POST('/api/users/me/deletion'));
}
