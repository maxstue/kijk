import { apiClient } from '@/shared/lib/api-client';
import { type CsvDownload, toCsvDownload } from '@/shared/utils/download';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { ConsumptionData } from './types';

/** A downloaded CSV file. */
export type { CsvDownload } from '@/shared/utils/download';

/** Loads the years that have consumptions. */
export async function getYears(signal?: AbortSignal) {
  return unwrapApiResponse(await apiClient.GET('/api/consumptions/years', { signal }));
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
export async function getConsumptionsBy(year?: string, month?: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.GET('/api/consumptions', {
      params: { query: { month, year } },
      signal,
    }),
  );
}

/** Loads a single consumption. */
export async function getConsumption(id: string, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.GET('/api/consumptions/{id}', {
      params: { path: { id } },
      signal,
    }),
  );
}

/**
 * Get stats for the resource usage.
 *
 * @param year The year of the resource
 * @param month The month of the resource
 * @param signal The signal
 * @returns The list of resources
 */
export async function getConsumptionsStats(year?: string, month?: string, signal?: AbortSignal) {
  if (!year || !month) {
    throw new Error('Year and month are required to load consumption stats.');
  }

  return unwrapApiResponse(
    await apiClient.GET('/api/consumptions/stats', {
      params: { query: { month, year } },
      signal,
    }),
  );
}

/** Records a consumption; the value type defaults to an absolute meter reading. */
export async function createConsumption(data: ConsumptionData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.POST('/api/consumptions', {
      body: {
        date: data.date.toISOString(),
        name: data.name,
        resourceId: data.resourceId,
        value: data.value,
        valueType: data.valueType ?? 'Absolute',
        startsNewMeterSegment: data.startsNewMeterSegment ?? false,
      },
      signal,
    }),
  );
}

/** Updates a consumption; omitted fields keep their current value. */
export async function updateConsumption(id: string, data: Partial<ConsumptionData>, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/consumptions/{id}', {
      body: {
        date: data.date?.toISOString() ?? null,
        name: data.name ?? null,
        resourceId: data.resourceId ?? null,
        value: data.value ?? null,
        valueType: data.valueType ?? 'Absolute',
        startsNewMeterSegment: data.startsNewMeterSegment ?? false,
      },
      params: {
        path: { id },
      },
      signal,
    }),
  );
}

/** Deletes a consumption. */
export async function deleteConsumption(id: string, signal?: AbortSignal) {
  return ensureApiSuccess(
    await apiClient.DELETE('/api/consumptions/{id}', {
      params: {
        path: { id },
      },
      signal,
    }),
  );
}

/** Exports a single consumption as CSV. */
export async function exportConsumption(id: string, signal?: AbortSignal): Promise<CsvDownload> {
  const result = await apiClient.GET('/api/consumptions/{id}/export', {
    params: { path: { id } },
    parseAs: 'blob',
    signal,
  });

  return toCsvDownload(result, `consumption-${id}.csv`);
}

/**
 * Exports all consumptions of a month as CSV.
 *
 * @param year The year.
 * @param month The English month name.
 * @param signal Aborts the request.
 */
export async function exportConsumptionMonth(year: number, month: string, signal?: AbortSignal): Promise<CsvDownload> {
  const result = await apiClient.GET('/api/consumptions/export', {
    params: { query: { month, year } },
    parseAs: 'blob',
    signal,
  });

  return toCsvDownload(result, `consumptions-${year}-${month}.csv`);
}
