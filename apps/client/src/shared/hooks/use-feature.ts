import * as usersOptions from '@kijk/api/users/options';
import type { Features } from '@kijk/api/users/types';
import { useQuery } from '@tanstack/react-query';

/** A part of Kijk that a PostHog feature flag switches on or off. */
export type Feature = keyof Features;

/**
 * Whether a part of Kijk is switched on for the current user. The API evaluates the flags and enforces them, so the
 * client shows exactly what the API allows and never asks PostHog itself. While the answer is not known yet, a part
 * counts as on: a wrong guess only shows an unavailable page.
 */
export function useFeature(feature: Feature) {
  const { data } = useQuery(usersOptions.featuresQueryOptions());
  return data?.[feature] ?? true;
}
