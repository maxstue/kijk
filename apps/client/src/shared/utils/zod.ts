import { z } from 'zod';

type TypeToZodShape<T> = [T] extends [string | number | boolean | undefined | null]
  ? z.Schema<T>
  : { [K in keyof T]: TypeToZodShape<T[K]> };

/**
 * A function that creates zod schemas from your own interfaces, with full autocomplete.
 *
 * @returns A type safe zod schema based on the interface.
 */
export function zodBuilder<TType extends Record<string, any>>() {
  return <TShape extends TypeToZodShape<TType>>(shape: TShape): z.ZodObject<TType> => z.object(shape as any) as any;
}
