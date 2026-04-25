import type { ConsumptionCreateFormSchema } from '@/app/consumptions/schemas';
import type { components } from '@/shared/api/generated/kijk';
import { apiClient, unwrapApiResponse } from '@/shared/lib/api-client';

type CreateConsumptionRequest = components['schemas']['CreateConsumptionRequest'];
type UpdateConsumptionRequest = components['schemas']['UpdateConsumptionRequest'];

export function getYears(signal?: AbortSignal) {
  return apiClient.GET('/api/consumptions/years', { signal }).then((response) => unwrapApiResponse(response));
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
export function getConsumptionsBy(year?: string, month?: string, signal?: AbortSignal) {
  return apiClient
    .GET('/api/consumptions', {
      params: { query: { month, year } },
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

/**
 * Get stats for the resource usage.
 *
 * @param year The year of the resource
 * @param month The month of the resource
 * @param signal The signal
 * @returns The list of resources
 */
export function getConsumptionsStats(year?: string, month?: string, signal?: AbortSignal) {
  if (!year || !month) {
    throw new Error('Year and month are required to load consumption stats.');
  }

  return apiClient
    .GET('/api/consumptions/stats', {
      params: { query: { month, year } },
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

export function createConsumption(data: ConsumptionCreateFormSchema, signal?: AbortSignal) {
  return apiClient
    .POST('/api/consumptions', {
      body: toCreateConsumptionRequest(data),
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

export function updateConsumption(id: string, data: Partial<ConsumptionCreateFormSchema>, signal?: AbortSignal) {
  return apiClient
    .PUT('/api/consumptions/{id}', {
      body: toUpdateConsumptionRequest(data),
      params: {
        path: { id },
      },
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

export function deleteConsumption(id: string, signal?: AbortSignal) {
  return apiClient
    .DELETE('/api/consumptions/{id}', {
      params: {
        path: { id },
      },
      signal,
    })
    .then((response) => unwrapApiResponse(response));
}

function toCreateConsumptionRequest(data: ConsumptionCreateFormSchema): CreateConsumptionRequest {
  return {
    date: data.date.toISOString(),
    name: data.name,
    resourceId: data.resourceId,
    value: data.value,
    valueType: data.valueType ?? 'Absolute',
  };
}

function toUpdateConsumptionRequest(data: Partial<ConsumptionCreateFormSchema>): UpdateConsumptionRequest {
  return {
    date: data.date?.toISOString() ?? null,
    name: data.name ?? null,
    resourceId: data.resourceId ?? null,
    value: data.value ?? null,
    valueType: data.valueType ?? 'Absolute',
  };
}
