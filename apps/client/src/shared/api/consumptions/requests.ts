import { apiClient } from '@/shared/lib/api-client';
import { ensureApiSuccess, unwrapApiResponse } from '@/shared/utils/http';

import type { ConsumptionData } from './types';

export interface CsvDownload {
  blob: Blob;
  fileName: string;
}

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

export async function createConsumption(data: ConsumptionData, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.POST('/api/consumptions', {
      body: {
        date: data.date.toISOString(),
        name: data.name,
        resourceId: data.resourceId,
        value: data.value,
        valueType: data.valueType ?? 'Absolute',
      },
      signal,
    }),
  );
}

export async function updateConsumption(id: string, data: Partial<ConsumptionData>, signal?: AbortSignal) {
  return unwrapApiResponse(
    await apiClient.PUT('/api/consumptions/{id}', {
      body: {
        date: data.date?.toISOString() ?? null,
        name: data.name ?? null,
        resourceId: data.resourceId ?? null,
        value: data.value ?? null,
        valueType: data.valueType ?? 'Absolute',
      },
      params: {
        path: { id },
      },
      signal,
    }),
  );
}

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

export async function exportConsumption(id: string, signal?: AbortSignal): Promise<CsvDownload> {
  const result = await apiClient.GET('/api/consumptions/{id}/export', {
    params: { path: { id } },
    parseAs: 'blob',
    signal,
  });

  return toCsvDownload(result, `consumption-${id}.csv`);
}

export async function exportConsumptionMonth(year: number, month: string, signal?: AbortSignal): Promise<CsvDownload> {
  const result = await apiClient.GET('/api/consumptions/export', {
    params: { query: { month, year } },
    parseAs: 'blob',
    signal,
  });

  return toCsvDownload(result, `consumptions-${year}-${month}.csv`);
}

function toCsvDownload<TError>(
  result: { data: Blob; error?: never; response: Response } | { data?: never; error: TError; response: Response },
  fallbackFileName: string,
): CsvDownload {
  const blob = unwrapApiResponse(result);
  const disposition = result.response.headers.get('Content-Disposition');
  const encodedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const fileName = encodedFileName
    ? decodeURIComponent(encodedFileName)
    : (disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackFileName);

  return { blob, fileName };
}
