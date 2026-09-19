import type { Consumption } from '@/shared/types/domain';

export interface AnnualResourceSummary {
  entries: Consumption[];
  entryCount: number;
  resource: Consumption['resource'];
  totalValue: number;
}

interface PendingAnnualResourceSummary extends Omit<AnnualResourceSummary, 'totalValue'> {
  recordedConsumption: number;
}

export function createAnnualResourceSummaries(consumptions: Consumption[]): AnnualResourceSummary[] {
  const summaries = new Map<string, PendingAnnualResourceSummary>();

  for (const consumption of consumptions) {
    const existing = summaries.get(consumption.resource.id);
    const calculatedConsumption = Number(consumption.calculatedConsumption);

    if (existing) {
      existing.entries.push(consumption);
      existing.entryCount += 1;
      existing.recordedConsumption += Number.isFinite(calculatedConsumption) ? calculatedConsumption : 0;
      continue;
    }

    summaries.set(consumption.resource.id, {
      entries: [consumption],
      entryCount: 1,
      recordedConsumption: Number.isFinite(calculatedConsumption) ? calculatedConsumption : 0,
      resource: consumption.resource,
    });
  }

  return [...summaries.values()]
    .map((summary) => {
      const entries = summary.entries.sort((left, right) => right.date.localeCompare(left.date));
      const latestReadingEntry = entries.find((entry) => entry.calculatedMeterReading != null);
      const numericMeterReading = Number(latestReadingEntry?.calculatedMeterReading);
      const latestMeterReading = Number.isFinite(numericMeterReading) ? numericMeterReading : undefined;

      const { recordedConsumption, ...resourceSummary } = summary;

      return {
        ...resourceSummary,
        entries,
        totalValue: latestMeterReading ?? recordedConsumption,
      } satisfies AnnualResourceSummary;
    })
    .sort((left, right) => left.resource.name.localeCompare(right.resource.name));
}
