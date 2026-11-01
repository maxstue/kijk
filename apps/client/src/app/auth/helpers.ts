/** Displays Clerk's user-facing message without dumping session objects or unexpected errors. */
export function authErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('errors' in error) || !Array.isArray(error.errors)) {
    return fallback;
  }
  const first: unknown = error.errors[0];
  if (typeof first !== 'object' || first === null) {
    return fallback;
  }
  if ('longMessage' in first && typeof first.longMessage === 'string' && first.longMessage) {
    return first.longMessage;
  }
  return 'message' in first && typeof first.message === 'string' && first.message ? first.message : fallback;
}
