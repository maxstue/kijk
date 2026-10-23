import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';

import { useFeature } from '@/shared/hooks/use-feature';

/** `/finances`: the whole finance area; while the `finances` feature flag is off it leads back home. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances')({
  component: FinancesLayout,
});

function FinancesLayout() {
  const { spaceId } = Route.useParams();
  const enabled = useFeature('finances');

  return enabled ? <Outlet /> : <Navigate params={{ spaceId }} replace to='/$spaceId' />;
}
