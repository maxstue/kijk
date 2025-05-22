import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import type { ClassValue } from 'clsx';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

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
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    // fallback in case there's an error stringifying.
    // for example, due to circular references.
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
  return <TShape extends TypeToZodShape<TType>>(shape: TShape): z.ZodObject<TType> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    return z.object(shape as any) as any;
  };
}
