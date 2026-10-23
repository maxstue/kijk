import { browserStorage } from '@kijk/core/lib/browser-storage';

import type { CookieConsent } from '@/shared/types/analytics';
import { COOKIE_CONSENT_KEY } from '@/shared/types/analytics';

/** Reads the analytics and performance tracing choice stored in this browser; without a stored choice it is undecided. */
export function getCookieConsent(): CookieConsent {
  return browserStorage.hasItem(COOKIE_CONSENT_KEY)
    ? browserStorage.getItem<CookieConsent>(COOKIE_CONSENT_KEY)!
    : 'undecided';
}
