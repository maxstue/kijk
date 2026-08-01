import type { components } from '@/shared/api/generated/kijk';

export type CurrentUser = components['schemas']['CurrentUserResponse'];
export type ReadyCurrentUser = components['schemas']['GetMeUserResponse'];

/** Returns whether a current-account response contains a fully initialized Kijk user. */
export function isReadyCurrentUser(
  response: CurrentUser,
): response is CurrentUser & { status: 'Ready'; user: ReadyCurrentUser } {
  return response.status === 'Ready' && response.user !== undefined;
}

export interface UpdateUserData {
  analyticsConsent?: 'Accepted' | 'Declined' | null;
  householdName?: string | null;
  useDefaultResources?: boolean | null;
  useExternalProfile?: boolean | null;
  userName?: string | null;
}

export interface WelcomeUserData {
  analyticsConsent: 'Accepted' | 'Declined';
  displayName: string;
  householdName: string;
  useDefaultResources: boolean;
  useExternalProfile: boolean;
}
