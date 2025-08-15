import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/consumptions-limits')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello to limits</div>;
}
