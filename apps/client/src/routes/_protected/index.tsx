import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/')({
  beforeLoad: () => {
    throw redirect({ replace: true, to: '/home' });
  },
});
