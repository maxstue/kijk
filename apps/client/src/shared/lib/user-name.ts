import { z } from 'zod';

/** Description of the unique name, shared by onboarding and the profile settings. */
export const uniqueNameHint =
  'Kijk adds a four-digit number to make your name unique, for example Max#4821. Others can invite you into a space with this unique name.';

/**
 * The Kijk user name. `#` separates the name from its number and `@` would look like an e-mail address when inviting,
 * so the API rejects both.
 */
export const userNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  // oxlint-disable-next-line no-control-regex -- control characters are rejected on purpose
  .refine((name) => !/[#@\u0000-\u001f\u007f]/.test(name), { message: 'The name must not contain # or @.' });
