import { describe, expect, test } from 'vite-plus/test';

import { SpacePermissions, hasSpacePermission, spacePermissionLabels } from './permissions';

describe('hasSpacePermission', () => {
  const space = { role: { permissions: [SpacePermissions.consumptions.view] } };

  test('returns true when the role grants the permission', () => {
    expect(hasSpacePermission(space, SpacePermissions.consumptions.view)).toBe(true);
  });

  test('returns false when the role does not grant the permission', () => {
    expect(hasSpacePermission(space, SpacePermissions.space.delete)).toBe(false);
  });

  test('returns false without a space', () => {
    expect(hasSpacePermission(undefined, SpacePermissions.consumptions.view)).toBe(false);
  });
});

describe('spacePermissionLabels', () => {
  test('describes every permission', () => {
    const permissions = Object.values(SpacePermissions).flatMap((group) => Object.values(group));
    expect(Object.keys(spacePermissionLabels).toSorted()).toEqual(permissions.toSorted());
  });
});
