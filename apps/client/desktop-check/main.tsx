import { configureApiClient } from '@kijk/api/client';
import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ConsumptionCreateForm } from '@/app/consumptions/create-form';

import '@kijk/ui/globals.css';

const resource = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Electricity',
  color: '#2563eb',
  unit: 'kWh',
};
const entries: Array<{ id: string; name: string; value: number; resource: typeof resource; date: string }> = [];
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

// This bounded in-memory transport proves portability. It deliberately does not claim persistence or sync.
configureApiClient({
  baseUrl: 'https://local.invalid',
  fetch: async (input) => {
    const request = input as Request;
    const path = new URL(request.url).pathname;
    if (path === '/api/users/me') {
      return Response.json({
        status: 'Ready',
        user: {
          id: 'user',
          spaces: [
            {
              id: 'space',
              isPersonal: true,
              role: { permissions: Object.values(SpacePermissions).flatMap((group) => Object.values(group)) },
            },
          ],
        },
      });
    }
    if (path === '/api/spaces/space/resources') {
      return Response.json([resource]);
    }
    if (path === '/api/spaces/space/consumptions' && request.method === 'POST') {
      const entry = { ...(await request.json()), id: crypto.randomUUID(), resource };
      entries.push(entry);
      return Response.json({ ...entry, limitWarnings: [] }, { status: 201 });
    }
    if (path === '/api/spaces/space/consumptions') {
      return Response.json(entries);
    }
    return Response.json([]);
  },
});

const root = createRootRoute({ component: Outlet });
const authenticated = createRoute({ getParentRoute: () => root, id: '_authenticated', component: Outlet });
const app = createRoute({ getParentRoute: () => authenticated, id: '_app', component: Outlet });
const space = createRoute({ getParentRoute: () => app, path: '$spaceId', component: Outlet });
const consumptions = createRoute({ getParentRoute: () => space, path: 'consumptions', component: Outlet });
const overview = createRoute({
  getParentRoute: () => consumptions,
  id: '_overview',
  validateSearch: () => ({
    year: String(new Date().getFullYear()),
    month: new Date().toLocaleString('en', { month: 'long' }).toLowerCase(),
  }),
  component: Outlet,
});
const index = createRoute({ getParentRoute: () => overview, path: '/', component: Pilot });
if (!location.hash) {
  location.hash = '/space/consumptions';
}
const router = createRouter({
  history: createHashHistory(),
  routeTree: root.addChildren([
    authenticated.addChildren([
      app.addChildren([space.addChildren([consumptions.addChildren([overview.addChildren([index])])])]),
    ]),
  ]),
});

function Pilot() {
  const [saved, setSaved] = useState(false);
  const { data = [] } = useQuery(consumptionsOptions.listQueryOptions('space'));
  return (
    <main className='mx-auto max-w-lg space-y-6 p-6'>
      <h1 className='text-2xl font-semibold'>Shared consumption form</h1>
      <p>Static build check. Data stays in memory for this session.</p>
      <ConsumptionCreateForm consumptions={[]} onClose={() => setSaved(true)} />
      {saved && <p role='status'>Consumption saved locally in this test session.</p>}
      <ul>
        {data.map((entry) => (
          <li key={entry.id}>
            {entry.name}: {entry.value} kWh
          </li>
        ))}
      </ul>
    </main>
  );
}

createRoot(document.getElementById('app')!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>,
);
