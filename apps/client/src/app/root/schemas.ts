import { z } from 'zod';

/** Validation of the feedback form. */
export const feedbackSchema = z.object({
  message: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
});

/** Values of the feedback form. */
export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
