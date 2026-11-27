import { z } from 'zod';

/** A unique name such as `Max#4821`: a name, `#` and four digits. Mirrors `UniqueName.TryParse` in the API. */
const uniqueNamePattern = /^\s*\S.*#\d{4}\s*$/;

/** Returns whether the invitee is an e-mail address rather than a unique name. */
export function isEmailInvitee(invitee: string) {
  return invitee.includes('@');
}

/** Form schema of the invitation dialog: one person by unique name or e-mail address, plus the granted role. */
export const inviteSchema = z.object({
  invitee: z
    .string()
    .trim()
    .min(1, 'Enter a unique name or an e-mail address')
    .refine(
      (invitee) => (isEmailInvitee(invitee) ? z.string().email().safeParse(invitee).success : true),
      'Enter a valid e-mail address',
    )
    .refine(
      (invitee) => isEmailInvitee(invitee) || uniqueNamePattern.test(invitee),
      'A unique name looks like Max#4821',
    ),
  roleId: z.string().min(1),
});

/** Values of the invitation dialog form. */
export type InviteFormValues = z.infer<typeof inviteSchema>;
