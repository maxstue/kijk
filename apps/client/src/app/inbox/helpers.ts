import { ApiError } from '@kijk/api/errors';

import { unavailableInvitationMessage } from './constants';

/** Explains why an invitation could not be answered; a missing invitation was revoked, declined or expired. */
export function invitationErrorMessage(error: unknown) {
  if (ApiError.isApiError(error) && error.status === 404) {
    return unavailableInvitationMessage;
  }
  return 'The invitation could not be answered. Please try again.';
}
