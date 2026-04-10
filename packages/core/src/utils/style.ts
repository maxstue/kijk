import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges and deduplicates class names using clsx and tailwind-merge.
 * @param inputs A list of class names to merge and deduplicate. Can include conditional class names using clsx syntax.
 * @returns A single string of class names with duplicates removed, suitable for use in a className attribute.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
