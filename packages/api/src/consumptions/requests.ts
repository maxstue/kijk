import { apiClient } from '@kijk/api/client';
import { type CsvDownload, toCsvDownload } from '@kijk/api/download';
import {
  consumptionsDelete,
  consumptionsDetails,
  consumptionsExport,
  consumptionsExportMonth,
  consumptionsList,
  consumptionsRecord,
  consumptionsStatistics,
  consumptionsUpdate,
  consumptionsYears,
} from '@kijk/api/generated/sdk';

import type { ConsumptionData } from './types';

// Readings belong to a calendar day; converting local midnight to UTC would shift that day.
function serializeConsumptionDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

/** A downloaded CSV file. */
export type { CsvDownload } from '@kijk/api/download';

/** Loads the years that have consumptions. */
export async function getYears(spaceId: string, signal?: AbortSignal) {
  return consumptionsYears({ client: apiClient(), path: { spaceId }, signal });
}

/**
 * Get the list of resource usage.
 *
 * If the year and month are provided, only the resource for that month and year will be returned. If they are not
 * provided, all resources will be returned. If only the year is provided, only the resources for that year will be
 * returned.
 *
 * @param year The year of the resource
 * @param month The month of the resource
 * @param signal The signal
 * @returns The list of resources
 */
export async function list(spaceId: string, year?: string, month?: string, signal?: AbortSignal) {
  return consumptionsList({ client: apiClient(), path: { spaceId }, query: { month, year }, signal });
}

/** Loads a single consumption. */
export async function getDetails(spaceId: string, id: string, signal?: AbortSignal) {
  return consumptionsDetails({ client: apiClient(), path: { spaceId, id }, signal });
}

/**
 * Get stats for the resource usage.
 *
 * @param year The year of the resource
 * @param month The month of the resource
 * @param signal The signal
 * @returns The list of resources
 */
export async function getStatistics(spaceId: string, year?: string, month?: string, signal?: AbortSignal) {
  if (!year || !month) {
    throw new Error('Year and month are required to load consumption stats.');
  }

  return consumptionsStatistics({ client: apiClient(), path: { spaceId }, query: { month, year }, signal });
}

/** Records a consumption; the value type defaults to an absolute meter reading. */
export async function record(spaceId: string, data: ConsumptionData, signal?: AbortSignal) {
  return consumptionsRecord({
    client: apiClient(),
    path: { spaceId },
    body: {
      date: serializeConsumptionDate(data.date),
      name: data.name,
      resourceId: data.resourceId,
      value: data.value,
      valueType: data.valueType ?? 'Absolute',
      startsNewMeterSegment: data.startsNewMeterSegment ?? false,
    },
    signal,
  });
}

/** Updates a consumption; omitted fields keep their current value. */
export async function update(spaceId: string, id: string, data: Partial<ConsumptionData>, signal?: AbortSignal) {
  return consumptionsUpdate({
    client: apiClient(),
    body: {
      date: data.date ? serializeConsumptionDate(data.date) : null,
      name: data.name ?? null,
      resourceId: data.resourceId ?? null,
      value: data.value ?? null,
      valueType: data.valueType ?? null,
      startsNewMeterSegment: data.startsNewMeterSegment ?? null,
    },
    path: { spaceId, id },
    signal,
  });
}

/** Deletes a consumption. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await consumptionsDelete({ client: apiClient(), path: { spaceId, id }, signal });
}

/** Exports a single consumption as CSV. */
export async function exportCsv(spaceId: string, id: string, signal?: AbortSignal): Promise<CsvDownload> {
  const result = await consumptionsExport({ client: apiClient(), path: { spaceId, id }, throwOnError: false, signal });

  return toCsvDownload(result, `consumption-${id}.csv`);
}

/**
 * Exports all consumptions of a month as CSV.
 *
 * @param year The year.
 * @param month The English month name.
 * @param signal Aborts the request.
 */
export async function exportMonth(
  spaceId: string,
  year: number,
  month: string,
  signal?: AbortSignal,
): Promise<CsvDownload> {
  const result = await consumptionsExportMonth({
    client: apiClient(),
    path: { spaceId },
    query: { month, year },
    throwOnError: false,
    signal,
  });

  return toCsvDownload(result, `consumptions-${year}-${month}.csv`);
}
