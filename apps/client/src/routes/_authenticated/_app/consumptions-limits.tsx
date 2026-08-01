import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/_app/consumptions-limits')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello to limits</div>;
}
