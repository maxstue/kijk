import { Optional } from '@/types/tsTypes';

const initialRegex = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');

export function getInitailChars(stringValue: Optional<string>) {
  if (!stringValue) {
    return 'KJ';
  }
  const initials = [...stringValue.matchAll(initialRegex)] || [];

  return ((initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')).toUpperCase();
}
