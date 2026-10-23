import type { ResourceData } from '@kijk/api/resources/types';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import type { Unit } from '@kijk/api/units/types';
import type { CurrentUser } from '@kijk/api/users/types';
import { HttpResponse, http } from 'msw';
import { setupWorker } from 'msw/browser';

import type { Resource } from '@/shared/types/domain';

const unitId = '00000000-0000-4000-8000-000000000002';

/** The E2E user administrates its space, so it gets every space permission. */
const adminPermissions = Object.values(SpacePermissions).flatMap((group) => Object.values(group));

const units: Unit[] = [
  {
    id: unitId,
    name: 'Kilowatt hour',
    symbol: 'kWh',
    creatorType: 'System',
    conversionType: 'UnitsNet',
    quantityKey: 'Energy',
    unitsNetUnitName: null,
    referenceUnitId: null,
    conversionFactor: null,
    ownerUserId: null,
    isOwner: false,
    isAvailableInActiveSpace: true,
    isArchived: false,
    resourceCount: 0,
    spaceIds: [],
  },
];

const resources = new Map<string, Resource[]>();

const currentUser = {
  status: 'Ready',
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    authId: 'e2e-mock-user',
    name: 'E2E User',
    email: 'e2e@example.test',
    aiEnabled: true,
    analyticsConsent: 'Declined',
    analyticsConsentUpdatedAt: null,
    onboardingCompletedAt: '2026-01-01T00:00:00Z',
    sensitiveDataConsentAt: '2026-01-01T00:00:00Z',
    spaces: [
      {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'E2E Space',
        description: null,
        role: {
          id: '00000000-0000-4000-8000-000000000004',
          name: 'Admin',
          permissions: adminPermissions,
        },
        isDefault: true,
        isPersonal: false,
      },
      {
        id: '00000000-0000-4000-8000-000000000005',
        name: 'Personal',
        description: null,
        role: { id: '00000000-0000-4000-8000-000000000004', name: 'Admin', permissions: adminPermissions },
        isDefault: false,
        isPersonal: true,
      },
    ],
    resources: [],
    onboardingCompleted: true,
    useExternalProfile: false,
    externalIdentity: null,
  },
} satisfies CurrentUser;

let defaultSpaceId: string | null = currentUser.user.spaces[0]!.id;
const getCurrentUser = () => ({
  ...currentUser,
  user: {
    ...currentUser.user,
    spaces: currentUser.user.spaces.map((space) => ({ ...space, isDefault: space.id === defaultSpaceId })),
  },
});

const worker = setupWorker(
  http.get('*/api/users/me', () => HttpResponse.json(getCurrentUser())),
  http.get('*/api/users/me/features', () => HttpResponse.json({ aiImport: true, finances: true })),
  http.put('*/api/users/default-space', async ({ request }) => {
    const { spaceId } = (await request.json()) as { spaceId: string | null };
    if (spaceId !== null && !currentUser.user.spaces.some((space) => space.id === spaceId)) {
      return HttpResponse.json({ title: 'Space not found' }, { status: 404 });
    }
    defaultSpaceId = spaceId;
    return HttpResponse.json(getCurrentUser());
  }),
  http.get('*/api/spaces/:spaceId/resources', ({ params }) =>
    HttpResponse.json(resources.get(String(params.spaceId)) ?? []),
  ),
  http.post('*/api/spaces/:spaceId/resources', async ({ request, params }) => {
    const data = (await request.json()) as ResourceData;
    const unit = units.find((candidate) => candidate.id === data.unitId);
    if (!unit || !data.name.trim()) {
      return HttpResponse.json({ title: 'Invalid resource' }, { status: 400 });
    }

    const resource: Resource = {
      ...data,
      id: crypto.randomUUID(),
      unit: unit.symbol,
      unitName: unit.name,
      quantityKey: unit.quantityKey,
      creatorType: 'User',
    };
    const spaceId = String(params.spaceId);
    resources.set(spaceId, [...(resources.get(spaceId) ?? []), resource]);
    return HttpResponse.json(resource, { status: 201 });
  }),
  http.get('*/api/units', () =>
    HttpResponse.json({
      customCount: units.filter((unit) => unit.creatorType === 'User').length,
      items: units,
      page: 1,
      pageSize: Math.max(units.length, 1),
      totalCount: units.length,
    }),
  ),
);

await worker.start({
  onUnhandledRequest(request, print) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      print.error();
    }
  },
  quiet: true,
  serviceWorker: { url: '/mockServiceWorker.js' },
});
