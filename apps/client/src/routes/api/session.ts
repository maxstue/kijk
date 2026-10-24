import { createFileRoute } from '@tanstack/react-router';

/** Resolves only the routing identity of the current web session. */
export const Route = createFileRoute('/api/session')({
  server: {
    handlers: {
      GET: async () => {
        const { getSessionIdentity } = await import('@/server/handlers');
        return getSessionIdentity();
      },
    },
  },
});
