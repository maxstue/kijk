import type * as Api from '@kijk/api/generated/types';

/** A consumption entry. */
export type Consumption = Api.ConsumptionResponse;

/** How a consumption value is interpreted. */
export const ValueTypes = {
  ABSOLUTE: 'Absolute',
  RELATIVE: 'Relative',
} as const;

/** The resource of a statistic. */
export type ResourceStats = Api.ConsumptionStatsResourceResponse;

/** Who created a resource or unit. */
export const CreatorTypes = {
  SYSTEM: 'System',
  USER: 'User',
} as const;

/** A creator type. */
export type CreatorType = (typeof CreatorTypes)[keyof typeof CreatorTypes];

/** A resource consumptions are recorded for. */
export type Resource = Api.ResourceResponse;
