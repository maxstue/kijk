/**
 * Household permissions granted by the fixed household roles. Mirrors `HouseholdPermissions` in the API; check
 * permissions, never role names.
 */
export const HouseholdPermissions = {
  budgets: {
    plan: 'budgets:plan',
  },
  consumptions: {
    export: 'consumptions:export',
    record: 'consumptions:record',
    view: 'consumptions:view',
  },
  finances: {
    configure: 'finances:configure',
    export: 'finances:export',
    import: 'finances:import',
    record: 'finances:record',
    view: 'finances:view',
  },
  household: {
    configure: 'household:configure',
    delete: 'household:delete',
  },
  limits: {
    plan: 'limits:plan',
    view: 'limits:view',
  },
  members: {
    assignRole: 'members:assign-role',
    view: 'members:view',
  },
  resources: {
    configure: 'resources:configure',
    view: 'resources:view',
  },
  units: {
    share: 'units:share',
  },
} as const;

type PermissionGroups = typeof HouseholdPermissions;
/** Any permission name from {@link HouseholdPermissions}. */
export type HouseholdPermission = {
  [Group in keyof PermissionGroups]: PermissionGroups[Group][keyof PermissionGroups[Group]];
}[keyof PermissionGroups];

/** Human-readable descriptions of each permission, used to show what a role allows. */
export const householdPermissionLabels: Record<HouseholdPermission, string> = {
  'budgets:plan': 'Create and change budgets',
  'consumptions:export': 'Export consumptions',
  'consumptions:record': 'Record and correct consumptions',
  'consumptions:view': 'View consumptions and statistics',
  'finances:configure': 'Create, change and delete accounts and categories',
  'finances:export': 'Export transactions as CSV',
  'finances:import': 'Import transactions from bank exports',
  'finances:record': 'Record, categorize and correct transactions',
  'finances:view': 'View transactions and the budget overview',
  'household:configure': 'Change space details',
  'household:delete': 'Delete the space',
  'limits:plan': 'Create and change consumption limits',
  'limits:view': 'View consumption limits',
  'members:assign-role': 'Change the roles of other members',
  'members:view': 'View members and their roles',
  'resources:configure': 'Create, change and delete resources',
  'resources:view': 'View resources',
  'units:share': 'Share units with the space',
};

interface HouseholdWithRole {
  role: { permissions: readonly string[] };
}

/** Returns whether the user's role in the household grants the permission. */
export function hasHouseholdPermission(household: HouseholdWithRole | undefined, permission: HouseholdPermission) {
  return household?.role.permissions.includes(permission) ?? false;
}
