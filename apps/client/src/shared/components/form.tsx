import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cn } from 'cn';
import * as React from 'react';
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { Controller, FormProvider, useFormContext, useFormState } from 'react-hook-form';

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends ControllerProps<TFieldValues, TName> {}

interface FormItemProps extends React.ComponentProps<'div'> {}

interface FormLabelProps extends React.ComponentProps<'label'> {}

interface FormDescriptionProps extends React.ComponentProps<'p'> {}

interface FormMessageProps extends React.ComponentProps<'p'> {}

// TODO refactor using tanstack-form and use shadcn Field component as base

/** React Hook Form provider for a form built from the `Form*` components. */
const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

/** Connects a form field to React Hook Form and provides its name to the nested `Form*` components. */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: FormFieldProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

/** Returns ids and validation state of the surrounding form field. Use inside `FormField` and `FormItem`. */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  const { id } = itemContext;

  return {
    formDescriptionId: `${id}-form-item-description`,
    formItemId: `${id}-form-item`,
    formMessageId: `${id}-form-item-message`,
    id,
    name: fieldContext.name,
    ...fieldState,
  };
};

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

/** Wraps a label, control, description and message and gives them a shared id. */
function FormItem({ className, ...props }: FormItemProps) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot='form-item' className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

/** Label of the field; turns red when the field is invalid. */
function FormLabel({ className, ...props }: FormLabelProps) {
  const { error, formItemId } = useFormField();

  return (
    <label
      data-slot='form-label'
      data-error={Boolean(error)}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

interface FormControlProps extends Omit<useRender.ComponentProps<'div'>, 'render' | 'children'> {
  children: React.ReactElement;
}

/** Passes id and ARIA attributes for description and error to the wrapped control. */
function FormControl({ children, ...props }: FormControlProps) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return useRender({
    render: children,
    props: {
      'data-slot': 'form-control',
      ...mergeProps<'div'>(
        {
          id: formItemId,
          'aria-describedby': !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`,
          'aria-invalid': Boolean(error),
        },
        props,
      ),
    },
  });
}

/** Help text of the field. */
function FormDescription({ className, ...props }: FormDescriptionProps) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot='form-description'
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

/** Validation error of the field, or its children when the field is valid. */
function FormMessage({ className, ...props }: FormMessageProps) {
  const { error, formMessageId } = useFormField();
  const content = error ? String(error.message ?? '') : props.children;
  const hasBody = Boolean(content);

  return (
    <p
      data-slot='form-message'
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
      aria-hidden={!hasBody}
    >
      {hasBody ? (
        content
      ) : (
        <span className='invisible' aria-hidden>
          {'\u00A0'}
        </span>
      )}
    </p>
  );
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
