import { auth } from '@clerk/tanstack-react-start/server';

import { apiProblem, forwardApiRequest, hasBffRequestHeader } from './api-relay';

/** Verifies each request independently before resolving an upstream token; origin checks run in `start.ts`. */
export async function relayApiRequest(request: Request) {
  if (!hasBffRequestHeader(request)) {
    return apiProblem(403, 'Cross-origin request rejected');
  }
  if (!process.env.CLERK_SECRET_KEY) {
    return apiProblem(503, 'Authentication is not configured');
  }
  const session = await auth();
  if (!session.userId) {
    return apiProblem(401, 'Authentication required');
  }
  const token = await session.getToken();
  if (!token) {
    return apiProblem(401, 'Authentication required');
  }
  const apiOrigin = process.env.API_ORIGIN;
  if (!apiOrigin) {
    return apiProblem(503, 'The API is not configured');
  }
  return forwardApiRequest(request, { apiOrigin, token });
}
