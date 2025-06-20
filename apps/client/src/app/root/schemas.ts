import { z } from 'zod';

export const feedbackSchema = z.object({
  message: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
