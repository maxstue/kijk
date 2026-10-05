import type { components } from '@/shared/api/generated/kijk';

/** The current account state. */
export type CurrentUser = components['schemas']['CurrentUserResponse'];
/** A user who completed onboarding. */
export type ReadyCurrentUser = components['schemas']['GetMeUserResponse'];

/** Returns whether a current-account response contains a fully initialized Kijk user. */
export function isReadyCurrentUser(
  response: CurrentUser,
): response is CurrentUser & { status: 'Ready'; user: ReadyCurrentUser } {
  return response.status === 'Ready' && response.user !== undefined;
}

/** Changes to the user's settings. */
export interface UpdateUserData {
  aiEnabled?: boolean | null;
  analyticsConsent?: 'Accepted' | 'Declined' | null;
  spaceName?: string | null;
  useDefaultResources?: boolean | null;
  useExternalProfile?: boolean | null;
  userName?: string | null;
}

/** Onboarding form data. */
export interface WelcomeUserData {
  analyticsConsent: 'Accepted' | 'Declined';
  displayName: string;
  spaceName: string;
  useDefaultResources: boolean;
  useExternalProfile: boolean;
}
