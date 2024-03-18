import { useCallback, useState } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

import { AuthSchema, authSchema } from '@/app/auth/schemas';
import { Route } from '@/routes/auth';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { useAuthStoreActions } from '@/shared/stores/auth-store';
import { AllowedProviders } from '@/shared/types/app';

interface Props {
  className?: string;
  btnLabel: string;
  onSubmit: (email: string, password: string) => Promise<unknown>;
}

export function UserAuthForm({ className, btnLabel, onSubmit }: Props) {
  const form = useZodForm({
    schema: authSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signInWith } = useAuthStoreActions();
  const searchparams = Route.useSearch();

  async function handleEmailSubmit(data: AuthSchema) {
    setIsLoading(true);
    await onSubmit(data.email.toLowerCase(), data.password);
    setIsLoading(false);
  }

  const handleSignInWithGithub = useCallback(
    (provider: AllowedProviders = 'github') =>
      async () => {
        setIsLoading(true);
        await signInWith(provider, searchparams.from);
        setIsLoading(false);
      },
    [searchparams.from, signInWith],
  );

  return (
    <div className={cn('grid gap-6', className)}>
      <Form form={form} onSubmit={handleEmailSubmit} className='space-y-8'>
        <div className='grid gap-2'>
          <div className='grid gap-1'>
            <FormField control={form.control} name='email' render={EmailField} />
          </div>
          <div className='grid gap-1'>
            <FormField control={form.control} name='password' render={PasswordField} />
          </div>
          <Button type='submit' disabled={isLoading}>
            {!isLoading && btnLabel}
            {isLoading && <Icons.spinner className='h-5 w-5 animate-spin' />}
          </Button>
        </div>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
        </div>
      </div>
      <Button variant='outline' onClick={handleSignInWithGithub()} disabled={isLoading}>
        {isLoading ? (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <Icons.gitHub className='mr-2 h-4 w-4' />
        )}{' '}
        Github
      </Button>
    </div>
  );
}

function PasswordField({
  field,
}: {
  field: ControllerRenderProps<
    {
      email: string;
      password: string;
    },
    'password'
  >;
}) {
  return (
    <FormItem>
      <FormLabel>Password</FormLabel>
      <FormControl>
        {/* TODO add eye symbol to toggle input visability*/}
        <Input type='password' placeholder='Password' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function EmailField({
  field,
}: {
  field: ControllerRenderProps<
    {
      email: string;
      password: string;
    },
    'email'
  >;
}) {
  return (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder='Email' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
