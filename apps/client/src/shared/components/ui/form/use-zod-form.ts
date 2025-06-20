'use no memo';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { FieldErrors, UseFormProps } from 'react-hook-form';
import type { TypeOf, ZodSchema, z } from 'zod';

interface UseZodFormProps<TSchema extends ZodSchema> extends Exclude<UseFormProps<z.infer<TSchema>>, 'resolver'> {
  schema: TSchema;
}

export const useZodForm = <TSchema extends ZodSchema>({ schema, ...formProps }: UseZodFormProps<TSchema>) => {
  const form = useForm({ ...formProps, resolver: zodResolver(schema) });

  const handleInvalidFormState = (errors: FieldErrors<TypeOf<TSchema>>) =>
    toast.error('Error: Form validation', {
      description: `Correct errors: ${errors.root?.type} - ${errors.root?.message}`,
    });

  return { ...form, handleInvalidFormState };
};
