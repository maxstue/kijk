import { EnergyFormSchema } from '@/app/energy/schemas';
import { apiClient } from '@/shared/lib/api-client';
import type { Years } from '@/app/budget/types';
import type { Energy } from '@/shared/types/app';

const ENDPOINT = 'energies';

export function getYears(signal?: AbortSignal) {
  return apiClient.get<Years>({
    url: `${ENDPOINT}/years`,
    signal,
  });
}

/**
 * Get the list of energy usage.
 *
 * If the year and month are provided, only the energy for that month and year will be returned. If they are not
 * provided, all energy will be returned. If only the year is provided, only the energy for that year will be returned.
 *
 * @param year The year of the energy
 * @param month The month of the energy
 * @param signal The signal
 * @returns The list of energy
 */
export function getEnergyBy(year?: string, month?: string, signal?: AbortSignal) {
  return apiClient.get<Energy[]>({
    url: ENDPOINT,
    params: { year, month },
    signal,
  });
}

export function createEnergy(data: EnergyFormSchema, signal?: AbortSignal) {
  return apiClient.post<Energy>({
    url: ENDPOINT,
    data,
    signal,
  });
}

export function updateEnergy(id: string, data: Partial<EnergyFormSchema>, signal?: AbortSignal) {
  return apiClient.put<Energy>({
    url: `${ENDPOINT}/${id}`,
    data,
    signal,
  });
}

export function deleteEnergy(id: string, signal?: AbortSignal) {
  return apiClient.delete<Energy>({
    url: `${ENDPOINT}/${id}`,
    signal,
  });
}
