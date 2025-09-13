import { useCallback, useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useForm, type ControllerRenderProps } from 'react-hook-form';

import type { AuthSchema } from '@/app/auth/schemas';
import { authSchema } from '@/app/auth/schemas';
import { Route } from '@/routes/auth';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/helpers';
import { Allowed_Providers } from '@/shared/types/app';
import { zodResolver } from '@hookform/resolvers/zod';

interface Props {
  className?: string;
  btnLabel: string;
  onSubmit: (email: string, password: string) => Promise<unknown>;
}

export function UserAuthForm({ className, btnLabel, onSubmit }: Props) {
  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });
  const [isLoading, setIsLoading] = useState(false);
  const searchParameters = Route.useSearch();

  const { isLoaded, signIn } = useSignIn();

  async function handleEmailSubmit(data: AuthSchema) {
    setIsLoading(true);
    await onSubmit(data.email.toLowerCase(), data.password);
    setIsLoading(false);
  }

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) {
      return;
    }
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_github',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: searchParameters.from ?? '/',
    });
  }, [isLoaded, searchParameters.from, signIn]);

  return (
    <div className={cn('grid gap-6', className)}>
      <Form {...form}>
        <form className='space-y-8' onSubmit={form.handleSubmit(handleEmailSubmit)}>
          <div className='grid gap-6'>
            <div className='grid gap-1'>
              <FormField control={form.control} name='email' render={EmailField} />
            </div>
            <div className='grid gap-1'>
              <FormField control={form.control} name='password' render={PasswordField} />
            </div>
            <Button disabled={isLoading} type='submit'>
              {!isLoading && btnLabel}
              {isLoading && <Icons.spinner className='h-5 w-5 animate-spin' />}
            </Button>
          </div>
        </form>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>Or continue with</span>
        </div>
      </div>
      {/* Social logins */}
      {Allowed_Providers.map((provider) => (
        <Button key={provider} disabled={isLoading} variant='outline' onClick={handleSignUp}>
          {isLoading ? (
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Icons.gitHub className='mr-2 h-4 w-4' />
          )}{' '}
          {provider}
        </Button>
      ))}
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
        <Input placeholder='Password' type='password' {...field} />
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
