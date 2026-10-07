import { z } from 'zod';

/** Validation of the email/password form. */
export const authSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/** Values of the email/password form. */
export type AuthSchema = z.infer<typeof authSchema>;

/** Validation of the email verification code. */
export const authCodeSchema = z.object({
  code: z.string(),
});
/** Value of the verification code form. */
export type AuthCodeSchema = z.infer<typeof authCodeSchema>;
