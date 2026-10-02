import type { components } from '@/shared/api/generated/kijk';
import type { Optional } from '@/shared/types/common';

/** The user's account settings. */
export type AppUser = components['schemas']['UserResponse'];

/** Custom user metadata. */
export interface User_Metadata {
  user_name: Optional<string>;
}

/** Kinds of money transactions. */
export const TransactionType = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
} as const;

/** A transaction kind. */
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

/** A consumption entry. */
export type Consumption = components['schemas']['ConsumptionResponse'];

/** How a consumption value is interpreted. */
export const ValueTypes = {
  ABSOLUTE: 'Absolute',
  RELATIVE: 'Relative',
} as const;

/** A consumption value type. */
export type ValueType = (typeof ValueTypes)[keyof typeof ValueTypes];

/** Statistics of all resources. */
export type ConsumptionsStatsType = components['schemas']['GetStatsConsumptionsResponseWrapper'];

/** Statistics of one resource. */
export type ConsumptionsStats = components['schemas']['ConsumptionStatsResponse'];

/** The resource of a statistic. */
export type ResourceStats = components['schemas']['ConsumptionStatsResourceResponse'];

/** Who created a resource or unit. */
export const CreatorTypes = {
  SYSTEM: 'System',
  USER: 'User',
} as const;

/** A creator type. */
export type CreatorType = (typeof CreatorTypes)[keyof typeof CreatorTypes];

/** A resource consumptions are recorded for. */
export type Resource = components['schemas']['ResourceResponse'];

/** The years that have consumptions. */
export type Years = components['schemas']['GetYearsConsumptionQueryResponse'];
