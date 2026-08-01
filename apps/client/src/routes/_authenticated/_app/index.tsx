import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/_app/')({
  beforeLoad: () => {
    throw redirect({ replace: true, to: '/home' });
  },
});
