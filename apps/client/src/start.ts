import { clerkMiddleware } from '@clerk/tanstack-react-start/server';
import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import { apiProblem } from './server/problem';

/** Server functions and the API relay are cookie-authenticated, so both accept only same-origin requests. */
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: ({ handlerType, request }) =>
        handlerType === 'serverFn' || new URL(request.url).pathname.startsWith('/api/'),
      origin: import.meta.env.SSR ? process.env.APP_URL : undefined,
      failureResponse: ({ request }) =>
        apiProblem(request, 403, 'Your request could not be verified. Reload the application and try again.'),
    }),
    ...(import.meta.env.SSR && process.env.CLERK_SECRET_KEY
      ? [clerkMiddleware(({ url }) => ({ authorizedParties: [process.env.APP_URL ?? url.origin] }))]
      : []),
  ],
}));
