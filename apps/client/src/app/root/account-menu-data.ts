import type { components } from '@kijk/api/generated/kijk';

import { getInitialChars } from '@/app/root/helpers';
import { siteConfig } from '@/shared/config/site';

export type CurrentUser = components['schemas']['GetMeUserResponse'];

export interface AccountMenuData {
  displayName?: string | null;
  email?: string | null;
  spaceName: string;
  imageUrl?: string | null;
  initials: string;
}

export function getAccountMenuData(user?: CurrentUser, spaceId?: string): AccountMenuData {
  const displayName = getDisplayName(user);
  const email = getEmail(user);

  return {
    displayName,
    email,
    spaceName: getActiveSpaceName(user, spaceId),
    imageUrl: getImageUrl(user),
    initials: getInitialChars(getIdentityLabel(displayName, email)),
  };
}

function getDisplayName(user?: CurrentUser) {
  return user?.externalIdentity?.fullName ?? user?.name;
}

function getEmail(user?: CurrentUser) {
  return user?.externalIdentity?.email;
}

function getImageUrl(user?: CurrentUser) {
  return user?.externalIdentity?.imageUrl;
}

function getIdentityLabel(displayName?: string | null, email?: string | null) {
  return displayName ?? email ?? undefined;
}

function getActiveSpaceName(user?: CurrentUser, spaceId?: string) {
  return user?.spaces?.find((space) => space.id === spaceId)?.name ?? siteConfig.name;
}
