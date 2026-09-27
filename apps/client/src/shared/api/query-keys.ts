const users = {
  me: ['users', 'me'] as const,
};

const resources = {
  all: ['resources'] as const,
  detail: (id: string) => [...resources.all, 'detail', id] as const,
  list: () => [...resources.all, 'list'] as const,
};

const consumptions = {
  all: ['consumptions'] as const,
  byAll: () => [...consumptions.all, 'usage', 'getBy'] as const,
  by: (year?: string, month?: string) => [...consumptions.all, 'usage', 'getBy', year, month] as const,
  detail: (id: string) => [...consumptions.all, 'detail', id] as const,
  stats: (year?: string, month?: string) => [...consumptions.all, 'stats', year, month] as const,
  statsAll: () => [...consumptions.all, 'stats'] as const,
  years: () => [...consumptions.all, 'years'] as const,
};

const consumptionLimits = {
  all: ['consumption-limits'] as const,
  list: () => [...consumptionLimits.all, 'list'] as const,
};

const units = {
  all: ['units'] as const,
  list: (includeArchived = false) => [...units.all, 'list', includeArchived] as const,
  page: (
    scope: 'household' | 'personal',
    householdId: string | undefined,
    page: number,
    pageSize: number,
    search: string,
  ) => [...units.all, 'page', scope, householdId, page, pageSize, search] as const,
  system: () => [...units.all, 'system'] as const,
};

/** Query keys for the API queries and mutations. */
export const queryKeys = {
  consumptionLimits,
  consumptions,
  resources,
  units,
  users,
} as const;
