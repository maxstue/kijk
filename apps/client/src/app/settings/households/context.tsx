import { createContext, useContext } from 'react';

import type { components } from '@/shared/api/generated/kijk';

type Household = components['schemas']['UserHouseholdResponse'];
type User = components['schemas']['GetMeUserResponse'];

interface HouseholdSettingsContextValue {
  household: Household;
  user: User;
}

/** Household and user of the household settings pages, provided by the household route. */
export const HouseholdSettingsContext = createContext<HouseholdSettingsContextValue | null>(null);

/** Returns the household settings context; throws outside the household settings routes. */
export function useHouseholdSettings() {
  const context = useContext(HouseholdSettingsContext);
  if (!context) {
    throw new Error('Household settings must be rendered within their route.');
  }
  return context;
}
