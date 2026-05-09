const users = {
  current: ['users', 'current'] as const,
};

const resources = {
  all: ['resources'] as const,
  list: () => [...resources.all, 'list'] as const,
};

const consumptions = {
  all: ['consumptions'] as const,
  by: (year?: string, month?: string) => [...consumptions.all, 'usage', 'getBy', year, month] as const,
  stats: (year?: string, month?: string) => [...consumptions.all, 'stats', year, month] as const,
  statsAll: () => [...consumptions.all, 'stats'] as const,
  years: () => [...consumptions.all, 'years'] as const,
};

/** Query keys for the API queries and mutations. */
export const queryKeys = {
  consumptions,
  resources,
  users,
} as const;
