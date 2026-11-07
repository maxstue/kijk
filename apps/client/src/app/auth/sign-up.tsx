import { useSignUp } from '@clerk/tanstack-react-start/legacy';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Input } from '@kijk/ui/components/input';
import { Link, useRouter } from '@tanstack/react-router';
import type { Dispatch } from 'react';
import { useCallback, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { UserAuthForm } from '@/app/auth/auth-form';
import { authErrorMessage } from '@/app/auth/helpers';
import type { AuthCodeSchema } from '@/app/auth/schemas';
import { authCodeSchema } from '@/app/auth/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

interface Props {
  goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>>;
  redirectTo: string;
}

/** Sign-up view; email verification completes the session before the auth route loads the account. */
export function SignUp({ goto, redirectTo }: Props) {
  const [verify, setVerify] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const { isLoaded, signUp } = useSignUp();

  const handleRegister = useCallback(
    async (email: string, password: string) => {
      if (!isLoaded) {
        setErrorMessage('Sign-up is still loading. Please wait a moment and try again.');
        return;
      }
      setErrorMessage(undefined);

      try {
        await signUp.create({
          emailAddress: email,
          password,
        });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerify(true);
      } catch (error) {
        setVerify(false);
        setErrorMessage(authErrorMessage(error, 'Your account could not be created. Please try again.'));
      }
    },
    [isLoaded, signUp],
  );

  const handleGoToLogin = useCallback(() => {
    goto('Login');
  }, [goto]);

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Create an account</CardTitle>
          <CardDescription>Create an account with your email, Google, or GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <>
            <div className='grid gap-6'>
              {errorMessage && (
                <p role='alert' className='text-destructive text-sm'>
                  {errorMessage}
                </p>
              )}
              {verify ? (
                <div className='flex min-h-[336px] w-full flex-col'>
                  <p className='text-primary text-lg'>Please insert the code we&apos;ve send to your email.</p>
                  <Verify />
                </div>
              ) : (
                <UserAuthForm btnLabel='Sign Up' redirectTo={redirectTo} onSubmit={handleRegister} />
              )}
              <div className='text-center text-sm'>
                <Button variant='link' onClick={handleGoToLogin}>
                  Have an account? Sign In
                </Button>
              </div>
            </div>
          </>
        </CardContent>
      </Card>
      <div className='text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4'>
        By clicking continue, you agree to our <Link to='/terms'>Terms of Service</Link> and{' '}
        <Link to='/privacy'>Privacy Policy</Link>.
      </div>
    </div>
  );
}

function Verify() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();

  const form = useForm({
    defaultValues: {
      code: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(authCodeSchema),
  });

  const handleVerify = useCallback(
    async (data: AuthCodeSchema) => {
      if (!isLoaded) {
        setErrorMessage('Email verification is still loading. Please wait a moment and try again.');
        return;
      }
      setErrorMessage(undefined);

      try {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: data.code,
        });

        if (completeSignUp.status !== 'complete') {
          setErrorMessage(
            'Your email was checked, but account setup is not complete. Please contact support or try another sign-in method.',
          );
        }

        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId });
          await router.invalidate();
        }
      } catch (error) {
        setErrorMessage(
          authErrorMessage(error, 'The verification code could not be confirmed. Check the code and try again.'),
        );
      }
    },
    [isLoaded, router, setActive, signUp],
  );

  return (
    <div className='mt-6 grid gap-6'>
      {errorMessage && (
        <p role='alert' className='text-destructive text-sm'>
          {errorMessage}
        </p>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleVerify)}>
          <div className='grid gap-6'>
            <div className='grid gap-1'>
              <FormField control={form.control} name='code' render={CodeField} />
            </div>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              Verify Email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface CodeFieldProps {
  field: ControllerRenderProps<{ code: string }, 'code'>;
}

function CodeField({ field }: CodeFieldProps) {
  return (
    <FormItem>
      <FormLabel>Code</FormLabel>
      <FormControl>
        <Input placeholder='Code...' {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
