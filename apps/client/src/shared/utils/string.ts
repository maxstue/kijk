import { z } from 'zod';

import type { Nullish } from '@/shared/types/app';

const stringRequiredSchema = z.string().trim().min(1);
/**
 * Validates a given string if it is empty(null| undefined) or is only a whitespace
 *
 * @param value The string value to validate
 * @returns True if the value is NOT empty or is only a whitespace
 */
export function stringIsNotEmptyOrWhitespace(value: Nullish<string>): value is string {
  return stringRequiredSchema.safeParse(value).success;
}

const message = `
##    ## ####       ## ##    ##
##   ##   ##        ## ##   ##
##  ##    ##        ## ##  ##
#####     ##        ## #####
##  ##    ##  ##    ## ##  ##
##   ##   ##  ##    ## ##   ##
##    ## ####  ######  ##    ##

01001011 01001001 01001010 01001011

Welcome to Kijk, your household app.
Feedback, bug reports and suggestions are welcome on GitHub: https://github.com/maxstue/kijk/discussions
`;

/** A welcome message for users in the browser console. */
export function welcome() {
  const styles = ['font-size: 10px'].join(';');
  console.log(`%c${message}`, styles);
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param name The name to capitalize
 * @returns The capitalized name
 */
export function capitalizeFirstLetter(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
