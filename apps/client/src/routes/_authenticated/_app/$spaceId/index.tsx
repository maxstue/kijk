import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import { Dashboard } from '@/app/home/dashboard';
import { AppError } from '@/shared/components/errors/app-error';

/** The common overview of the route space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/')({
  validateSearch: z.object({
    year: z.coerce.number().int().min(2000).max(9998).optional().catch(undefined),
    month: z.coerce.number().int().min(1).max(12).optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: 'Space overview' }] }),
  component: HomeIndexPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
});

function HomeIndexPage() {
  const { spaceId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [now] = useState(() => new Date());
  return (
    <Dashboard
      spaceId={spaceId}
      year={search.year ?? now.getFullYear()}
      month={search.month ?? now.getMonth() + 1}
      onChange={(period) => void navigate({ search: period })}
    />
  );
}
