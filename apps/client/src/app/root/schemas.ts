import { z } from 'zod';

/** Validation of the feedback form. */
export const feedbackSchema = z.object({
  message: z.string().trim().min(2, { message: 'Message must be at least 2 characters' }).max(4000),
});

/** Values of the feedback form. */
export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
