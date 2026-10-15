import type { components } from '@kijk/api/generated/kijk';
import type { Months } from '@kijk/api/months';

/** A recorded consumption. */
export type Consumption = components['schemas']['ConsumptionResponse'];

/** Form data of a consumption. */
export interface ConsumptionData {
  date: Date;
  name: string;
  resourceId: string;
  value: number | string;
  valueType?: components['schemas']['CreateConsumptionRequest']['valueType'];
  startsNewMeterSegment?: boolean;
}

/** Variables of the update-consumption mutation. */
export interface UpdateConsumptionData {
  consumption: Partial<ConsumptionData>;
  id: string;
}

/** Variables of the delete-consumption mutation; year/month identify the cached lists to refresh. */
export interface DeleteConsumptionData {
  id: string;
  month?: Months;
  year?: number;
}
