import { apiClient } from '@kijk/api/client';
import {
  usersCompleteOnboarding,
  usersFeatures,
  usersFeedback,
  usersGuide,
  usersMe,
  usersRequestDeletion,
  usersResetGuide,
  usersSetDefaultSpace,
  usersUpdate,
  usersUpdateGuide,
} from '@kijk/api/generated/sdk';

import type { UpdateUserData, WelcomeUserData } from './types';

/** Loads persisted optional introduction progress. */
export async function getGuide(signal?: AbortSignal) {
  return usersGuide({ client: apiClient(), signal });
}

/** Clears only the current user's product introduction progress. */
export async function resetGuide() {
  return usersResetGuide({ client: apiClient() });
}

/** Records a completed subtour and optionally completion of the full tour. */
export async function updateGuide(data: { completedStep?: string; completedTour?: boolean }) {
  return usersUpdateGuide({
    client: apiClient(),
    body: { completedStep: data.completedStep ?? null, completedTour: data.completedTour ?? false },
  });
}

/** Submits voluntary feedback and rejects if delivery failed. */
export async function sendFeedback(data: { message: string }) {
  await usersFeedback({ client: apiClient(), body: data });
}

/** Loads the current account state. */
export async function getMe(signal?: AbortSignal) {
  return usersMe({ client: apiClient(), signal });
}

/** Loads the parts of Kijk that are switched on for the current user, as the API enforces them. */
export async function getFeatures(signal?: AbortSignal) {
  return usersFeatures({ client: apiClient(), signal });
}

/** Updates the user's settings; omitted values stay unchanged. */
export async function update(data: UpdateUserData) {
  return usersUpdate({
    client: apiClient(),
    body: {
      aiEnabled: data.aiEnabled ?? null,
      analyticsConsent: data.analyticsConsent ?? null,
      sensitiveDataConsent: data.sensitiveDataConsent ?? null,
      useDefaultResources: data.useDefaultResources ?? null,
      useExternalProfile: data.useExternalProfile ?? null,
      userName: data.userName ?? null,
    },
  });
}

/** Completes onboarding and creates the account and first space if needed. */
export async function completeOnboarding(data: WelcomeUserData) {
  return usersCompleteOnboarding({
    client: apiClient(),
    body: {
      analyticsConsent: data.analyticsConsent,
      displayName: data.displayName,
      spaceName: data.spaceName,
      useDefaultResources: data.useDefaultResources,
      useExternalProfile: data.useExternalProfile,
    },
  });
}

/** Sets the space the app opens first; `null` opens the last used space instead. */
export async function setDefaultSpace(spaceId: string | null) {
  return usersSetDefaultSpace({ client: apiClient(), body: { spaceId } });
}

/** Starts deleting the current user's account and all their data in the background. */
export async function requestDeletion() {
  await usersRequestDeletion({ client: apiClient() });
}
