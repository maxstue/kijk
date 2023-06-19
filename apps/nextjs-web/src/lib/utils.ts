import { z } from 'zod';

import { Months, months, Optional } from '@/types/app';

const initialRegex = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');

export function getInitailChars(stringValue: Optional<string>) {
  if (!stringValue) {
    return 'KJ';
  }
  const initials = [...stringValue.matchAll(initialRegex)] || [];

  return ((initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')).toUpperCase();
}

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

type TypeToZodShape<T> = [T] extends [string | number | boolean | undefined | null]
  ? z.Schema<T>
  : { [K in keyof T]: TypeToZodShape<T[K]> };

/**
 * A function that creates zod schemas from your own interfaces, with full autocomplete.
 * @returns A typesage zod schema based on the interface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodBuilder<TType extends Record<string, any>>() {
  return <TShape extends TypeToZodShape<TType>>(shape: TShape): z.ZodObject<TType> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return z.object(shape as any) as any;
  };
}

export function formatStringToCurrency(value: string) {
  const amount = parseFloat(value);
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function getMonthFromString(month: Months) {
  return months.indexOf(month) + 1;
}
