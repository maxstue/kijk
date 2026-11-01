import type { ResourceData } from '@kijk/api/resources/types';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import type { Unit } from '@kijk/api/units/types';
import type { CurrentUser } from '@kijk/api/users/types';
import { HttpResponse, delay, http } from 'msw';

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

const initialDefaultSpaceId = currentUser.user.spaces[0]!.id;
let defaultSpaceId: string | null = initialDefaultSpaceId;
const getCurrentUser = () => ({
  ...currentUser,
  user: {
    ...currentUser.user,
    spaces: currentUser.user.spaces.map((space) => ({ ...space, isDefault: space.id === defaultSpaceId })),
  },
});

/** Controls only the fake upstream; production authentication and the BFF remain unchanged. */
export interface DashboardScenario {
  finances: boolean;
  empty: boolean;
  emptyConsumptionYears: number[];
  consumptionError: boolean;
  consumptionDelayMs: number;
  periodDelayMs: number;
  multipleResources: boolean;
  sparseReadings: boolean;
  manyThresholds: boolean;
}
let dashboardScenario: DashboardScenario = {
  finances: true,
  empty: false,
  emptyConsumptionYears: [],
  consumptionError: false,
  consumptionDelayMs: 0,
  periodDelayMs: 0,
  multipleResources: false,
  sparseReadings: false,
  manyThresholds: false,
};
export function configureDashboard(scenario: Partial<DashboardScenario>) {
  dashboardScenario = { ...dashboardScenario, ...scenario };
}

/** Restores the initial data so that every test starts from the same state. */
export function resetMockApi() {
  resources.clear();
  dashboardScenario = {
    finances: true,
    empty: false,
    emptyConsumptionYears: [],
    consumptionError: false,
    consumptionDelayMs: 0,
    periodDelayMs: 0,
    multipleResources: false,
    sparseReadings: false,
    manyThresholds: false,
  };
  defaultSpaceId = initialDefaultSpaceId;
}

/** Fake responses of the .NET API, served behind the BFF by `server.ts`. */
export const handlers = [
  http.get('*/api/users/me', () => HttpResponse.json(getCurrentUser())),
  http.get('*/api/users/me/features', () =>
    HttpResponse.json({ aiImport: true, finances: dashboardScenario.finances }),
  ),
  http.get('*/api/spaces/:spaceId/dashboard/finances', async ({ request, params }) => {
    await delay(dashboardScenario.periodDelayMs);
    if (!dashboardScenario.finances) {
      return HttpResponse.json({ title: 'Disabled' }, { status: 404 });
    }
    if (dashboardScenario.empty) {
      return HttpResponse.json([]);
    }
    const year = Number(new URL(request.url).searchParams.get('year'));
    const personal = params.spaceId === '00000000-0000-4000-8000-000000000005';
    return HttpResponse.json(
      Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        currency: 'EUR',
        income: (personal ? 200 : 1000) + index + year - 2025,
        expenses: 100,
        balance: (personal ? 100 : 900) + index + year - 2025,
        hasData: true,
      })),
    );
  }),
  http.get('*/api/spaces/:spaceId/dashboard/budgets', async () => {
    await delay(dashboardScenario.periodDelayMs);
    if (!dashboardScenario.finances) {
      return HttpResponse.json({ title: 'Disabled' }, { status: 404 });
    }
    return HttpResponse.json(
      dashboardScenario.empty
        ? []
        : (dashboardScenario.manyThresholds ? [150, 140, 130] : [70, 60, 50]).map((percentage) => ({
            id: `budget-${percentage}`,
            name: `Household budget ${percentage}`,
            currency: 'EUR',
            amount: 100,
            spent: percentage,
            remaining: Math.max(0, 100 - percentage),
            overrun: Math.max(0, percentage - 100),
            percentage,
          })),
    );
  }),
  http.get('*/api/spaces/:spaceId/dashboard/consumptions', async ({ request, params }) => {
    await delay(dashboardScenario.consumptionDelayMs + dashboardScenario.periodDelayMs);
    if (dashboardScenario.consumptionError) {
      return HttpResponse.json({ title: 'Consumption unavailable' }, { status: 503 });
    }
    if (
      dashboardScenario.empty ||
      dashboardScenario.emptyConsumptionYears.includes(Number(new URL(request.url).searchParams.get('year')))
    ) {
      return HttpResponse.json([]);
    }
    const year = Number(new URL(request.url).searchParams.get('year'));
    const personal = params.spaceId === '00000000-0000-4000-8000-000000000005';
    const readings = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      resourceId: personal ? 'personal-energy' : 'shared-energy',
      name: personal ? 'Personal electricity' : 'Shared electricity',
      color: '#2563eb',
      unit: 'kWh',
      value: index === 0 ? 0 : (personal ? 200 : 10) + index + year - 2025,
      meterReading: 1000 + index * 10 + (personal ? 1000 : 0),
    }));
    if (dashboardScenario.sparseReadings) {
      return HttpResponse.json(readings.filter((row) => row.month >= 8 && row.month <= 10));
    }
    return HttpResponse.json(
      dashboardScenario.multipleResources
        ? [
            ...readings,
            ...readings.map((row) => ({
              ...row,
              resourceId: 'solar',
              name: 'Solar energy',
              color: '#16a34a',
              value: row.value / 2,
              meterReading: row.meterReading / 2,
            })),
            ...readings.map((row) => ({
              ...row,
              resourceId: 'water',
              name: 'Water',
              color: '#06b6d4',
              unit: 'm³',
              value: row.month / 3,
              meterReading: 100 + row.month / 3,
            })),
            {
              month: 5,
              resourceId: 'rainwater',
              name: 'Rainwater',
              color: '#8b5cf6',
              unit: 'm³',
              value: 7,
              meterReading: null,
            },
          ]
        : readings,
    );
  }),
  http.get('*/api/spaces/:spaceId/dashboard/limits', async ({ request }) => {
    await delay(dashboardScenario.periodDelayMs);
    if (dashboardScenario.empty) {
      return HttpResponse.json([]);
    }
    const url = new URL(request.url);
    const year = Number(url.searchParams.get('year'));
    const month = Number(url.searchParams.get('month'));
    const periodStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const periodEnd = new Date(Date.UTC(year, month, 1)).toISOString();
    if (dashboardScenario.manyThresholds) {
      return HttpResponse.json(
        [70, 80, 90, 100, 110, 120, 130].map((percentage) => ({
          id: `limit-${percentage}`,
          name: `Consumption limit ${percentage}`,
          unit: 'kWh',
          threshold: 100,
          actualValue: percentage,
          remaining: Math.max(0, 100 - percentage),
          overrun: Math.max(0, percentage - 100),
          percentage,
          periodStart,
          periodEnd,
        })),
      );
    }
    return HttpResponse.json([
      {
        id: 'monthly',
        name: 'Monthly electricity',
        unit: 'kWh',
        threshold: 100,
        actualValue: month * 10,
        remaining: Math.max(0, 100 - month * 10),
        overrun: Math.max(0, month * 10 - 100),
        percentage: month * 10,
        periodStart,
        periodEnd,
      },
      {
        id: 'zero',
        name: 'Zero allowance',
        unit: 'kWh',
        threshold: 0,
        actualValue: 5,
        remaining: 0,
        overrun: 5,
        percentage: null,
        periodStart,
        periodEnd,
      },
    ]);
  }),
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
  http.post('*/api/spaces/:spaceId/imports', async ({ request }) => {
    const file = (await request.formData()).get('file');
    return file instanceof File
      ? HttpResponse.json({ fileName: file.name, size: file.size }, { status: 202 })
      : HttpResponse.json({ title: 'File required' }, { status: 400 });
  }),
  http.get(
    '*/api/spaces/:spaceId/consumptions/export',
    () =>
      new HttpResponse('date,value\n', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="readings.csv"',
          'Set-Cookie': 'upstream=secret',
        },
      }),
  ),
  http.get('*/api/units', () =>
    HttpResponse.json({
      customCount: units.filter((unit) => unit.creatorType === 'User').length,
      items: units,
      page: 1,
      pageSize: Math.max(units.length, 1),
      totalCount: units.length,
    }),
  ),
];
