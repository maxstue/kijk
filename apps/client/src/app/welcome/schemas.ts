import { z } from 'zod';

/** Validation of the onboarding form. */
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
  useExternalProfile: z
    .boolean()
    .nullable()
    .transform((value, context) => {
      if (value === null) {
        context.addIssue({
          code: 'custom',
          message: 'Please choose whether Kijk may use your sign-in profile.',
        });
        return z.NEVER;
      }

      return value;
    }),
});

/** Onboarding form values while editing. */
export type UserStepFormDraft = z.input<typeof userStepSchema>;
/** Validated onboarding form values. */
export type UserStepFormValues = z.output<typeof userStepSchema>;
