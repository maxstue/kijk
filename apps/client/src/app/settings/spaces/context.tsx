import { createContext, useContext } from 'react';

import type { components } from '@/shared/api/generated/kijk';

type Space = components['schemas']['UserSpaceResponse'];
type User = components['schemas']['GetMeUserResponse'];

interface SpaceSettingsContextValue {
  space: Space;
  user: User;
}

/** Space and user of the space settings pages, provided by the space route. */
export const SpaceSettingsContext = createContext<SpaceSettingsContextValue | null>(null);

/** Returns the space settings context; throws outside the space settings routes. */
export function useSpaceSettings() {
  const context = useContext(SpaceSettingsContext);
  if (!context) {
    throw new Error('Space settings must be rendered within their route.');
  }
  return context;
}
