import { createFileRoute, redirect } from '@tanstack/react-router';

/** `/finances`: no page of its own; opens the budgets. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/')({
  beforeLoad: ({ params: { spaceId } }) => {
    throw redirect({ params: { spaceId: spaceId }, replace: true, to: '/$spaceId/finances/budgets' });
  },
});
