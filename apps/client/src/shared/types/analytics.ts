/** Local storage key of the analytics consent of signed-out users. */
export const COOKIE_CONSENT_KEY = 'cookie_consent';

/** The user's analytics consent. */
export type CookieConsent = 'accepted' | 'declined' | 'undecided';
