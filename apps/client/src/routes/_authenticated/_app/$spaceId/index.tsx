import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import { GuideCard } from '@/app/guide/card';
import { Dashboard } from '@/app/home/dashboard';
import { RouteError } from '@/shared/components/errors/route-error';

/** The common overview of the route space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/')({
  validateSearch: z.object({
    introduction: z.enum(['tour', 'checklist']).optional().catch(undefined),
    year: z.coerce.number().int().min(2000).max(9998).optional().catch(undefined),
    resource: z.string().min(1).optional().catch(undefined),
    view: z.enum(['meter', 'consumption']).default('meter').catch('meter'),
    month: z.coerce.number().int().min(1).max(12).optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: 'Space overview' }] }),
  component: HomeIndexPage,
  errorComponent: RouteError,
});

function HomeIndexPage() {
  const { spaceId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [now] = useState(() => new Date());
  return (
    <div className='space-y-6'>
      <GuideCard
        key={spaceId}
        spaceId={spaceId}
        request={search.introduction}
        onRequestHandled={() =>
          void navigate({ replace: true, search: (previous) => ({ ...previous, introduction: undefined }) })
        }
      />
      <Dashboard
        spaceId={spaceId}
        year={search.year ?? now.getFullYear()}
        month={search.month ?? now.getMonth() + 1}
        resourceId={search.resource}
        view={search.view}
        onResourceChange={(resource) => void navigate({ search: (previous) => ({ ...previous, resource }) })}
        onViewChange={(view) => void navigate({ search: (previous) => ({ ...previous, view }) })}
        onChange={(period) => void navigate({ search: (previous) => ({ ...previous, ...period }) })}
      />
    </div>
  );
}
