import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type AuthSchema = z.infer<typeof authSchema>;

export const authCodeSchema = z.object({
  code: z.string(),
});
export type AuthCodeSchema = z.infer<typeof authCodeSchema>;
