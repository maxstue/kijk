import { createFileRoute, redirect } from '@tanstack/react-router';

/** `/finances`: no page of its own; opens the budgets. */
export const Route = createFileRoute('/_authenticated/_app/finances/')({
  beforeLoad: () => {
    throw redirect({ replace: true, to: '/finances/budgets' });
  },
});
