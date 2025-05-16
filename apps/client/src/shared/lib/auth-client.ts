/** A wrapper around the browser's window Clerk object. So you can use the clerk instance outside of the react context. */
async function getAuthToken() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  if (!window.Clerk) {
    console.warn('Clerk is not loaded yet. Make sure to load the Clerk.js script before using this function.');
    return undefined;
  }
  if (!window.Clerk.session) {
    console.warn(
      'Clerk session is not available yet. Make sure to load the Clerk.js script before using this function.',
    );
    return undefined;
  }
  return window.Clerk?.session?.getToken();
}

export { getAuthToken };
