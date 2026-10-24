import { apiClient } from '@kijk/api/client';
import { unwrapApiResponse } from '@kijk/api/http';

import type { UpdateUserData, WelcomeUserData } from './types';

/** Submits voluntary feedback and rejects if delivery failed. */
export async function sendFeedback(data: { message: string }) {
  await apiClient().POST('/api/users/me/feedback', { body: data });
}

/** Loads the current account state. */
export async function getMe(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/users/me', { signal }));
}

/** Loads the parts of Kijk that are switched on for the current user, as the API enforces them. */
export async function getFeatures(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient().GET('/api/users/me/features', { signal }));
}

/** Updates the user's settings; omitted values stay unchanged. */
export async function update(data: UpdateUserData) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/users/me', {
      body: {
        aiEnabled: data.aiEnabled ?? null,
        analyticsConsent: data.analyticsConsent ?? null,
        sensitiveDataConsent: data.sensitiveDataConsent ?? null,
        useDefaultResources: data.useDefaultResources ?? null,
        useExternalProfile: data.useExternalProfile ?? null,
        userName: data.userName ?? null,
      },
    }),
  );
}

/** Completes onboarding and creates the account and first space if needed. */
export async function completeOnboarding(data: WelcomeUserData) {
  return unwrapApiResponse(
    await apiClient().PUT('/api/users/onboarding', {
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

/** Sets the space the app opens first; `null` opens the last used space instead. */
export async function setDefaultSpace(spaceId: string | null) {
  return unwrapApiResponse(await apiClient().PUT('/api/users/default-space', { body: { spaceId } }));
}

/** Starts deleting the current user's account and all their data in the background. */
export async function requestDeletion() {
  await apiClient().POST('/api/users/me/deletion');
}
