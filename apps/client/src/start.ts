import { clerkMiddleware } from '@clerk/tanstack-react-start/server';
import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

/** Server functions and the API relay are cookie-authenticated, so both accept only same-origin requests. */
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: ({ handlerType, request }) =>
        handlerType === 'serverFn' || new URL(request.url).pathname.startsWith('/api/'),
      origin: import.meta.env.SSR ? process.env.APP_ORIGIN : undefined,
    }),
    ...(import.meta.env.SSR && process.env.CLERK_SECRET_KEY
      ? [clerkMiddleware(({ url }) => ({ authorizedParties: [process.env.APP_ORIGIN ?? url.origin] }))]
      : []),
  ],
}));
