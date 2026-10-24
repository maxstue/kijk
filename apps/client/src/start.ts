import { clerkMiddleware } from '@clerk/tanstack-react-start/server';
import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

/** Cookie-authenticated server functions require explicit CSRF middleware when Start is configured here. */
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (context) => context.handlerType === 'serverFn',
      origin: import.meta.env.SSR ? process.env.APP_ORIGIN : undefined,
    }),
    ...(import.meta.env.SSR && process.env.CLERK_SECRET_KEY
      ? [clerkMiddleware(({ url }) => ({ authorizedParties: [process.env.APP_ORIGIN ?? url.origin] }))]
      : []),
  ],
}));
