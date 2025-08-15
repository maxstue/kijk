import type { Optional } from '@/shared/types/app';

const initialRegex = new RegExp(/(\p{L}{1})\p{L}+/gu);

/**
 * Get initials from a string.
 *
 * @param stringValue The string value to get the initials from.
 * @returns Returns the initials.
 */
export function getInitialChars(stringValue: Optional<string>) {
  if (!stringValue) {
    return 'KJ';
  }
  const initials = [...stringValue.matchAll(initialRegex)];

  return ((initials.shift()?.[1] ?? '') + (initials.pop()?.[1] ?? '')).toUpperCase();
}
