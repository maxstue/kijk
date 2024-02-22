import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ navigate }) => {
    console.log('index beforeLoad');

    await navigate({ to: '/home' });
  },
});
