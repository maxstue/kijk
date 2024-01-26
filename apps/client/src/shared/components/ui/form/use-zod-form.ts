import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, useForm, UseFormProps } from 'react-hook-form';
import { TypeOf, z, ZodSchema } from 'zod';

import { useToast } from '@/shared/hooks/use-toast';

interface UseZodFormProps<S extends ZodSchema> extends Exclude<UseFormProps<z.infer<S>>, 'resolver'> {
  schema: S;
}

export const useZodForm = <S extends ZodSchema>({ schema, ...formProps }: UseZodFormProps<S>) => {
  const form = useForm({ ...formProps, resolver: zodResolver(schema) });

  const { toast } = useToast();

  const handleInvalidFormState = (errors: FieldErrors<TypeOf<S>>) =>
    toast({
      title: 'Error: Form validation',
      description: `Correcterrors: ${errors.root?.type} - ${errors.root?.message}`,
      variant: 'destructive',
    });

  return { ...form, handleInvalidFormState };
};
