import type { Clerk as CClerk } from '@clerk/types';

/**
 * Define a global type for Clerk.
 * This allows us to access the Clerk instance outside of the React context.
 * This is useful for server-side rendering or other non-React contexts.
 */
declare global {
  var Clerk: CClerk | undefined;
}


/** A wrapper around the browser's window Clerk object. So you can use the clerk instance outside of the react context. */
function getAuthToken() {
  if (!globalThis.Clerk) {
    console.warn('Clerk is not loaded yet. Make sure to load the Clerk.js script before using this function.');
    return;
  }
  if (!globalThis.Clerk.session) {
    console.warn(
      'Clerk session is not available yet. Make sure to load the Clerk.js script before using this function.',
    );
    return;
  }
  return globalThis.Clerk.session.getToken();
}

export { getAuthToken };
