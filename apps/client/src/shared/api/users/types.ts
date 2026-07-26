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
