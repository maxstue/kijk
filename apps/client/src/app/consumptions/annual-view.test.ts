import { describe, expect, test } from 'vitest';

import type { Consumption } from '@/shared/types/domain';

import { createAnnualResourceSummaries } from './helpers';

describe('createAnnualResourceSummaries', () => {
  test('uses the latest normalized meter reading per resource', () => {
    const resource = {
      color: '#f59e0b',
      icon: 'zap',
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Electricity',
      unit: 'kWh',
    };
    const olderEntry = createConsumption('22222222-2222-2222-2222-222222222222', 120, resource, '2026-01-01', 1_120);
    const newerEntry = createConsumption('33333333-3333-3333-3333-333333333333', 80, resource, '2026-02-01', 1_200);
    const consumptions = [olderEntry, newerEntry];

    expect(createAnnualResourceSummaries(consumptions)).toEqual([
      {
        entries: [newerEntry, olderEntry],
        entryCount: 2,
        resource,
        totalValue: 1_200,
      },
    ]);
  });

  test('sums direct consumption when no absolute meter baseline exists', () => {
    const resource = {
      color: '#3b82f6',
      icon: 'droplets',
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Water',
      unit: 'l',
    };
    const firstEntry = createConsumption('55555555-5555-5555-5555-555555555555', 30, resource, '2026-01-01');
    const secondEntry = createConsumption('66666666-6666-6666-6666-666666666666', 20, resource, '2026-02-01');

    expect(createAnnualResourceSummaries([firstEntry, secondEntry])).toEqual([
      {
        entries: [secondEntry, firstEntry],
        entryCount: 2,
        resource,
        totalValue: 50,
      },
    ]);
  });
});

function createConsumption(
  id: string,
  calculatedConsumption: number,
  resource: Consumption['resource'],
  date: string,
  calculatedMeterReading?: number,
): Consumption {
  return {
    calculatedConsumption,
    calculatedMeterReading,
    date: `${date}T00:00:00Z`,
    description: null,
    id,
    name: 'Reading',
    resource,
    startsNewMeterSegment: false,
    value: calculatedConsumption,
    valueType: 'Relative',
  };
}
