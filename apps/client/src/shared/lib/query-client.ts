import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query client: no retries, no refetch on focus, 60 s stale time. */
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 60_000,
    },
  },
});

export { queryClient };
