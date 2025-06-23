import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { Controller, FormProvider, useFormContext, useFormState } from 'react-hook-form';
import type { Label as LabelPrimitiv } from 'radix-ui';

import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/helpers';
import { AppError } from '@/shared/types/errors';

interface Props<T extends FieldValues> extends Omit<React.ComponentProps<'form'>, 'onSubmit' | 'onInvalid'> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  onInvalid?: SubmitErrorHandler<T>;
}

function Form<T extends FieldValues>({ form, onSubmit, onInvalid, children, ...props }: Props<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} {...props}>
        <fieldset className={props.className} disabled={form.formState.isSubmitting}>
          {children}
        </fieldset>
      </form>
    </FormProvider>
  );
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.use(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext.name) {
    throw new AppError({ type: 'VALIDATION', message: 'useFormField should be used within <FormField>' });
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('grid gap-2', className)} data-slot='form-item' {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitiv.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      className={cn('data-[error=true]:text-destructive-foreground', className)}
      data-error={!!error}
      data-slot='form-label'
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof SlotPrimitive.Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <SlotPrimitive.Slot
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`}
      aria-invalid={!!error}
      data-slot='form-control'
      id={formItemId}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      className={cn('text-muted-foreground text-sm', className)}
      data-slot='form-description'
      id={formDescriptionId}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? '') : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn('text-destructive-foreground text-sm', className)}
      data-slot='form-message'
      id={formMessageId}
      {...props}
    >
      {body}
    </p>
  );
}

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
