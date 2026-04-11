import { z } from 'zod';

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
    // Fallback in case there's an error stringifying.
    // For example, due to circular references.
    return new Error(String(thrown));
  }
};

type TypeToZodShape<T> = [T] extends [string | number | boolean | undefined | null]
  ? z.Schema<T>
  : { [K in keyof T]: TypeToZodShape<T[K]> };

/**
 * A function that creates zod schemas from your own interfaces, with full autocomplete.
 *
 * @returns A typesafe zod schema based on the interface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodBuilder<TType extends Record<string, any>>() {
  return <TShape extends TypeToZodShape<TType>>(shape: TShape): z.ZodObject<TType> => z.object(shape as any) as any;
}
