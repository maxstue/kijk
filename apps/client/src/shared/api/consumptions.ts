import type { ConsumptionCreateFormSchema } from '@/app/consumptions/schemas';
import { apiClient } from '@/shared/lib/api-client';
import type { Consumption, ConsumptionsStatsType, Years } from '@/shared/types/app';

const ENDPOINT = 'consumptions';

export function getYears(signal?: AbortSignal) {
  return apiClient.get<Years>({
    signal,
    url: `${ENDPOINT}/years`,
  });
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
  return apiClient.get<Consumption[]>({
    params: { month, year },
    signal,
    url: ENDPOINT,
  });
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
  return apiClient.get<ConsumptionsStatsType>({
    params: { month, year },
    signal,
    url: `${ENDPOINT}/stats`,
  });
}

export function createConsumption(data: ConsumptionCreateFormSchema, signal?: AbortSignal) {
  return apiClient.post<Consumption>({
    data,
    signal,
    url: ENDPOINT,
  });
}

export function updateConsumption(id: string, data: Partial<ConsumptionCreateFormSchema>, signal?: AbortSignal) {
  return apiClient.put<Consumption>({
    data,
    signal,
    url: `${ENDPOINT}/${id}`,
  });
}

export function deleteConsumption(id: string, signal?: AbortSignal) {
  return apiClient.delete<Consumption>({
    signal,
    url: `${ENDPOINT}/${id}`,
  });
}
