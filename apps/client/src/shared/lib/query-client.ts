import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 60_000,
    },
    mutations: {
      retry: false,
    },
  },
});

export { queryClient };
