import { useSignIn } from '@clerk/tanstack-react-start/legacy';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { GitHubIcon, GoogleIcon, SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { cn } from 'cn';
import { useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import type { AuthSchema } from '@/app/auth/schemas';
import { authSchema } from '@/app/auth/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import type { AllowedProviders } from '@/shared/types/auth';
import { Allowed_Providers, Auth_Provider_Strategies } from '@/shared/types/auth';

interface Props {
  className?: string;
  btnLabel: string;
  onSubmit: (email: string, password: string) => Promise<unknown>;
  redirectTo: string;
}

/** Email and password form used by sign-in and sign-up; calls `onSubmit` with the credentials. */
export function UserAuthForm({ className, btnLabel, onSubmit, redirectTo }: Props) {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(authSchema),
  });
  const isLoading = form.formState.isSubmitting;
  const [loadingProvider, setLoadingProvider] = useState<AllowedProviders | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();

  const { isLoaded, signIn } = useSignIn();

  async function handleEmailSubmit(data: AuthSchema) {
    await onSubmit(data.email.toLowerCase(), data.password);
  }

  const handleSocialSignIn = async (provider: AllowedProviders) => {
    if (!isLoaded || isLoading || loadingProvider) {
      return;
    }

    setLoadingProvider(provider);
    setErrorMessage(undefined);

    try {
      await signIn.authenticateWithRedirect({
        redirectUrl: '/sso-callback',
        redirectUrlComplete: `/auth?from=${encodeURIComponent(redirectTo)}`,
        strategy: Auth_Provider_Strategies[provider],
      });
    } catch {
      setLoadingProvider(null);
      setErrorMessage(`${provider} sign-in could not be started. Please try again or choose another sign-in method.`);
    }
  };

  const isBusy = isLoading || loadingProvider !== null;

  return (
    <div className={cn('grid gap-6', className)}>
      {errorMessage && (
        <p role='alert' className='text-destructive text-sm'>
          {errorMessage}
        </p>
      )}
      <Form {...form}>
        <form className='space-y-8' onSubmit={form.handleSubmit(handleEmailSubmit)}>
          <div className='grid gap-6'>
            <div className='grid gap-1'>
              <FormField control={form.control} name='email' render={EmailField} />
            </div>
            <div className='grid gap-1'>
              <FormField control={form.control} name='password' render={PasswordField} />
            </div>
            <Button disabled={isBusy} type='submit'>
              {!isLoading && btnLabel}
              {isLoading && <SpinnerIcon className='h-5 w-5 animate-spin' />}
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
      {Allowed_Providers.map((provider) => {
        const ProviderIcon = provider === 'Google' ? GoogleIcon : GitHubIcon;

        return (
          <Button key={provider} disabled={isBusy} variant='outline' onClick={() => handleSocialSignIn(provider)}>
            {loadingProvider === provider ? (
              <SpinnerIcon className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <ProviderIcon className='mr-2 h-4 w-4' />
            )}{' '}
            {provider}
          </Button>
        );
      })}
    </div>
  );
}

interface PasswordFieldProps {
  field: ControllerRenderProps<
    {
      email: string;
      password: string;
    },
    'password'
  >;
}

function PasswordField({ field }: PasswordFieldProps) {
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

interface EmailFieldProps {
  field: ControllerRenderProps<
    {
      email: string;
      password: string;
    },
    'email'
  >;
}

function EmailField({ field }: EmailFieldProps) {
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
