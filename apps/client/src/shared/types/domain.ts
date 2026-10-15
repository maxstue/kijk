import type { components } from '@kijk/api/generated/kijk';

/** A consumption entry. */
export type Consumption = components['schemas']['ConsumptionResponse'];

/** How a consumption value is interpreted. */
export const ValueTypes = {
  ABSOLUTE: 'Absolute',
  RELATIVE: 'Relative',
} as const;

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
