import { HttpResponse, http } from 'msw';
import { setupWorker } from 'msw/browser';

import { HouseholdPermissions } from '@/shared/api/households/permissions';
import type { ResourceData } from '@/shared/api/resources/types';
import type { Unit } from '@/shared/api/units/types';
import type { CurrentUser } from '@/shared/api/users/types';
import type { Resource } from '@/shared/types/domain';

const unitId = '00000000-0000-4000-8000-000000000002';

/** The E2E user administrates its household, so it gets every household permission. */
const adminPermissions = Object.values(HouseholdPermissions).flatMap((group) => Object.values(group));

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
    isAvailableInActiveHousehold: true,
    isArchived: false,
    resourceCount: 0,
    householdIds: [],
  },
];

const resources: Resource[] = [];

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
    households: [
      {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'E2E Household',
        description: null,
        role: {
          id: '00000000-0000-4000-8000-000000000004',
          name: 'Admin',
          permissions: adminPermissions,
        },
        isActive: true,
      },
    ],
    resources: [],
    onboardingCompleted: true,
    useExternalProfile: false,
    externalIdentity: null,
  },
} satisfies CurrentUser;

const worker = setupWorker(
  http.get('*/api/users/me', () => HttpResponse.json(currentUser)),
  http.get('*/api/resources', () => HttpResponse.json(resources)),
  http.post('*/api/resources', async ({ request }) => {
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
    resources.push(resource);
    return HttpResponse.json(resource, { status: 201 });
  }),
  http.get('*/api/units', () => HttpResponse.json(units)),
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
