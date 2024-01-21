import { FileRoute } from '@tanstack/react-router';

export const Route = new FileRoute('/').createRoute({
  beforeLoad: async ({ navigate }) => {
    console.log('index');

    await navigate({ to: '/home' });
  },
});
