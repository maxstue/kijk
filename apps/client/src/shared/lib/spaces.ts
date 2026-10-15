import type { ReadyCurrentUser } from '@kijk/api/users/types';
import { browserStorage } from '@kijk/core/lib/browser-storage';

const lastSpaceStorageKey = 'last-space';

type UserSpace = NonNullable<ReadyCurrentUser['spaces']>[number];

/** Remembers the space the user opened last on this device. */
export function rememberLastSpace(spaceId: string) {
  browserStorage.setItem(lastSpaceStorageKey, spaceId);
}

/**
 * Returns the space the app opens first: the user's default space, otherwise the space opened last on this device,
 * otherwise the first shared space or the personal space.
 */
export function getStartSpace(user: ReadyCurrentUser): UserSpace | undefined {
  const spaces = user.spaces ?? [];
  const lastSpaceId = browserStorage.getItem<string>(lastSpaceStorageKey);
  return (
    spaces.find((space) => space.isDefault) ??
    spaces.find((space) => space.id === lastSpaceId) ??
    spaces.find((space) => !space.isPersonal) ??
    spaces[0]
  );
}
