import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ navigate }) => {
    await navigate({ to: '/home' });
  },
});
