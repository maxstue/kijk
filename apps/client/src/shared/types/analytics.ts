/** Local storage key of the analytics consent of signed-out users. */
export const COOKIE_CONSENT_KEY = 'cookie_consent';

/** Former local storage key of a persistent request id; it is removed from the browser on startup. */
export const LEGACY_CORRELATION_ID_KEY = 'X-Correlation-Id';

/** The user's analytics consent. */
export type CookieConsent = 'accepted' | 'declined' | 'undecided';
