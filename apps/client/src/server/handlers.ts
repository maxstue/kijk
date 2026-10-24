import { auth } from '@clerk/tanstack-react-start/server';

import { apiProblem, forwardApiRequest, isSameOriginWrite } from './api-relay';

/** Verifies each request independently before resolving an upstream token. */
export async function relayApiRequest(request: Request) {
  if (!isSameOriginWrite(request, process.env.APP_ORIGIN)) {
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
  return forwardApiRequest(request, { apiOrigin, token, webOrigin: process.env.APP_ORIGIN });
}

/** Minimal routing identity. No token or profile is serialized to the browser. */
export async function getSessionIdentity() {
  if (!process.env.CLERK_SECRET_KEY) {
    return apiProblem(503, 'Authentication is not configured');
  }
  const session = await auth();
  return session.userId && session.sessionId
    ? Response.json({ id: session.sessionId, userId: session.userId }, { headers: { 'Cache-Control': 'no-store' } })
    : apiProblem(401, 'Authentication required');
}
