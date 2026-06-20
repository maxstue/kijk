/**
 * Example: class CustomError extends Error { data: Record<string, unknown>; constructor(message: string, data:
 * Record<string, unknown>) { super(message); this.data = data; } }
 *
 * Try { // do some stuff } catch (thrown) { let error = asError(thrown); if (error instanceof CustomError) {
 * console.error(error.data); return; } throw thrown; }
 *
 * @param thrown Error which is thrown
 * @returns Typesafe error
 */
export const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) {
    return thrown;
  }
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
};
