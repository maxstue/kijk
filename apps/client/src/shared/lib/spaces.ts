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
  return spaces.find((space) => space.isDefault) ?? getLastSpace(user) ?? spaces.find((space) => space.isPersonal);
}

/** Returns the last visited space on this device, if the user is still a member. */
export function getLastSpace(user: ReadyCurrentUser): UserSpace | undefined {
  let lastSpaceId: string | undefined;
  try {
    lastSpaceId = browserStorage.getItem<string>(`${lastSpaceStorageKey}:${user.id}`);
  } catch {
    // A corrupt value or unavailable storage leaves the caller to choose a fallback.
  }
  return user.spaces?.find((space) => space.id === lastSpaceId);
}
