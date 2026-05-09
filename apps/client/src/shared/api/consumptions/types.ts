import type { components } from '@/shared/api/generated/kijk';
import type { Months } from '@/shared/types/app';

export interface ConsumptionData {
  date: Date;
  name: string;
  resourceId: string;
  value: number | string;
  valueType?: components['schemas']['CreateConsumptionRequest']['valueType'];
}

export interface UpdateConsumptionData {
  consumption: Partial<ConsumptionData>;
  id: string;
}

export interface DeleteConsumptionData {
  id: string;
  month?: Months;
  year?: number;
}
