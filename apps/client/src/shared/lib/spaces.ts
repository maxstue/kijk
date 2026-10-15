import type { ReadyCurrentUser } from '@kijk/api/users/types';
import { browserStorage } from '@kijk/core/lib/browser-storage';

const lastSpaceStorageKey = 'last-space';

type UserSpace = NonNullable<ReadyCurrentUser['spaces']>[number];

/** Remembers the space the user opened last on this device. */
export function rememberLastSpace(userId: string, spaceId: string) {
  try {
    browserStorage.setItem(`${lastSpaceStorageKey}:${userId}`, spaceId);
  } catch {
    // Storage can be disabled; space navigation still works.
  }
}

/**
 * Returns the space the app opens first: the user's default space, otherwise the space opened last on this device,
 * otherwise the personal space.
 */
export function getStartSpace(user: ReadyCurrentUser): UserSpace | undefined {
  const spaces = user.spaces ?? [];
  let lastSpaceId: string | undefined;
  try {
    lastSpaceId = browserStorage.getItem<string>(`${lastSpaceStorageKey}:${user.id}`);
  } catch {
    // A corrupt value or unavailable storage falls back to the personal space.
  }
  return (
    spaces.find((space) => space.isDefault) ??
    spaces.find((space) => space.id === lastSpaceId) ??
    spaces.find((space) => space.isPersonal)
  );
}
