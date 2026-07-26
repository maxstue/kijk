import { z } from 'zod';

export const userStepSchema = z.object({
  analyticsConsent: z
    .enum(['Accepted', 'Declined'])
    .nullable()
    .transform((value, context) => {
      if (value === null) {
        context.addIssue({
          code: 'custom',
          message: 'Please choose whether to allow analytics.',
        });
        return z.NEVER;
      }

      return value;
    }),
  displayName: z.string().trim().min(2).max(100),
  householdName: z.string().trim().min(2).max(100),
  useDefaultResources: z.boolean(),
});

export type UserStepFormDraft = z.input<typeof userStepSchema>;
export type UserStepFormValues = z.output<typeof userStepSchema>;
