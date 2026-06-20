import type { components } from '@/shared/api/generated/kijk';
import type { Optional } from '@/shared/types/common';

export type AppUser = components['schemas']['UserResponse'];

export interface User_Metadata {
  user_name: Optional<string>;
}

export const TransactionType = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export type Consumption = components['schemas']['ConsumptionResponse'];

export const ValueTypes = {
  ABSOLUTE: 'Absolute',
  RELATIVE: 'Relative',
} as const;

export type ValueType = (typeof ValueTypes)[keyof typeof ValueTypes];

export type ConsumptionsStatsType = components['schemas']['GetStatsConsumptionsResponseWrapper'];

export type ConsumptionsStats = components['schemas']['ConsumptionStatsResponse'];

export type ResourceStats = components['schemas']['ConsumptionStatsResourceResponse'];

export const CreatorTypes = {
  SYSTEM: 'System',
  USER: 'User',
} as const;

export type CreatorType = (typeof CreatorTypes)[keyof typeof CreatorTypes];

export type Resource = components['schemas']['ResourceResponse'];

export type Years = components['schemas']['GetYearsConsumptionQueryResponse'];
