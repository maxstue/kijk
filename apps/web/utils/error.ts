/**
 * Example:
class CustomError extends Error {
  data: Record<string, unknown>;
  constructor(message: string, data: Record<string, unknown>) {
    super(message);
    this.data = data;
  }
}

try {
  // do some stuff
} catch (thrown) {
  let error = asError(thrown);
  if (error instanceof CustomError) {
    console.error(error.data);
    return;
  }
  throw thrown;
}
 * @param thrown Error which is thrown
 * @returns Typesafe error
 */
export const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    // fallback in case there's an error stringifying.
    // for example, due to circular references.
    return new Error(String(thrown));
  }
};
