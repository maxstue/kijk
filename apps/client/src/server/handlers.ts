import { auth } from '@clerk/tanstack-react-start/server';

import { forwardApiRequest, hasBffRequestHeader } from './api-relay';
import { apiProblem } from './problem';

/** Verifies each request independently before resolving an upstream token; origin checks run in `start.ts`. */
export async function relayApiRequest(request: Request) {
  if (!hasBffRequestHeader(request)) {
    return apiProblem(request, 403, 'Your request could not be verified. Reload the application and try again.');
  }
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('BFF configuration error: CLERK_SECRET_KEY is missing.');
    return apiProblem(request, 503, 'Sign-in is temporarily unavailable. Please try again later.');
  }
  const session = await auth();
  if (!session.userId) {
    return apiProblem(request, 401, 'You are not signed in or your session has expired. Please sign in again.');
  }
  const token = await session.getToken();
  if (!token) {
    return apiProblem(request, 401, 'Your session could not be verified. Please sign in again.');
  }
  const apiUrl = process.env.API_URL;
  if (!apiUrl?.trim()) {
    console.error('BFF configuration error: API_URL is missing.');
    return apiProblem(request, 503, 'You are signed in, but your account could not be loaded. Please try again later.');
  }
  return forwardApiRequest(request, { apiUrl, token });
}
