import { invalidate, invalidateInEverySpace } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  completeOnboarding,
  getFeatures,
  getMe,
  requestDeletion,
  sendFeedback,
  setDefaultSpace,
  update,
} from './requests';

/** Sends voluntary feedback without changing cached account data. */
export const feedbackMutationOptions = () => mutationOptions({ mutationFn: sendFeedback, retry: false });

/** Query for the current account state. */
export const meQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getMe(signal),
    queryKey: queryKeys.users.me,
  });

/** Query for the parts of Kijk that are switched on for the current user; only for users who completed onboarding. */
export const featuresQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getFeatures(signal),
    queryKey: queryKeys.users.features,
  });

/** Mutation that updates the user's settings. */
export const updateMutationOptions = () =>
  mutationOptions({
    mutationFn: update,
    // Resources of every space show values in the user's preferred units.
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.users.me), invalidateInEverySpace(client, 'resources')]),
  });

/** Mutation that completes onboarding. */
export const completeOnboardingMutationOptions = () =>
  mutationOptions({
    mutationFn: completeOnboarding,
    onSuccess: (data, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.me, data);
    },
  });

/** Mutation that sets or clears the space the app opens first. */
export const setDefaultSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: (spaceId: string | null) => setDefaultSpace(spaceId),
    onSuccess: (currentUser, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.me, currentUser);
    },
  });

/** Mutation that starts deleting the current user's account and all their data. */
export const requestDeletionMutationOptions = () =>
  mutationOptions({
    mutationFn: requestDeletion,
  });
