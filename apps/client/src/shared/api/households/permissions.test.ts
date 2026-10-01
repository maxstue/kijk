import { describe, expect, test } from 'vite-plus/test';

import { HouseholdPermissions, hasHouseholdPermission, householdPermissionLabels } from './permissions';

describe('hasHouseholdPermission', () => {
  const household = { role: { permissions: [HouseholdPermissions.consumptions.view] } };

  test('returns true when the role grants the permission', () => {
    expect(hasHouseholdPermission(household, HouseholdPermissions.consumptions.view)).toBe(true);
  });

  test('returns false when the role does not grant the permission', () => {
    expect(hasHouseholdPermission(household, HouseholdPermissions.household.delete)).toBe(false);
  });

  test('returns false without a household', () => {
    expect(hasHouseholdPermission(undefined, HouseholdPermissions.consumptions.view)).toBe(false);
  });
});

describe('householdPermissionLabels', () => {
  test('describes every permission', () => {
    const permissions = Object.values(HouseholdPermissions).flatMap((group) => Object.values(group));
    expect(Object.keys(householdPermissionLabels).toSorted()).toEqual(permissions.toSorted());
  });
});
