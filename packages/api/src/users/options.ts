import { invalidate, invalidateInEverySpace } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import {
  acceptInvitation,
  completeOnboarding,
  declineInvitation,
  getInvitations,
  getFeatures,
  getMe,
  requestDeletion,
  sendFeedback,
  setDefaultSpace,
  update,
  getGuide,
  updateGuide,
  resetGuide,
} from './requests';

/** User-owned introduction, shared across spaces and devices. */
export const guideQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.users.guide,
    queryFn: ({ signal }) => getGuide(signal),
  });

/** Saves guide progress and refetches the server-owned result. */
export const updateGuideMutationOptions = () =>
  mutationOptions({
    mutationFn: updateGuide,
    mutationKey: queryKeys.users.guide,
    scope: { id: 'guide-progress' },
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.users.guide),
  });

/** Resets progress in the same mutation scope as tour writes. */
export const resetGuideMutationOptions = () =>
  mutationOptions({
    mutationFn: resetGuide,
    mutationKey: queryKeys.users.guide,
    scope: { id: 'guide-progress' },
    onSuccess: (data, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.guide, data);
    },
  });

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

/** Query for the current user's pending invitations to shared spaces. */
export const invitationsQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getInvitations(signal),
    queryKey: queryKeys.users.invitations,
  });

/**
 * Mutation that accepts an invitation; the inbox, the current user with their spaces and the members of the joined
 * space are refetched before it resolves, so the app can open the space right away.
 */
export const acceptInvitationMutationOptions = () =>
  mutationOptions({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    mutationKey: queryKeys.users.invitations,
    onSuccess: ({ spaceId }, _invitationId, _result, { client }) =>
      invalidate(client, queryKeys.users.invitations, queryKeys.users.me, queryKeys.spaces.members(spaceId)),
    // A failed answer mostly means the invitation expired or was revoked meanwhile.
    onError: (_error, _invitationId, _result, { client }) => invalidate(client, queryKeys.users.invitations),
  });

/** Mutation that declines an invitation; the inbox is refetched, also after a failure. */
export const declineInvitationMutationOptions = () =>
  mutationOptions({
    mutationFn: (invitationId: string) => declineInvitation(invitationId),
    mutationKey: queryKeys.users.invitations,
    onSettled: (_data, _error, _invitationId, _result, { client }) => invalidate(client, queryKeys.users.invitations),
  });
