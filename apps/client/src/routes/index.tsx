import { FileRoute } from '@tanstack/react-router';

export const Route = new FileRoute('/').createRoute({
  beforeLoad: async ({ navigate }) => {
    await navigate({ to: '/home' });
  },
});
