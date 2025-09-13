import { useCallback, useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { getRouteApi } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import type { Dispatch } from 'react';

import type { AuthCodeSchema } from '@/app/auth/schemas';
import { UserAuthForm } from '@/app/auth/auth-form';
import { authCodeSchema } from '@/app/auth/schemas';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { env } from '@/shared/env';
import { zodResolver } from '@hookform/resolvers/zod';

const route = getRouteApi('/auth');

export function SignUp({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const [verify, setVerify] = useState<boolean>(false);
  const { isLoaded, signUp } = useSignUp();

  const handleRegister = useCallback(
    async (email: string, password: string) => {
      if (!isLoaded) {
        return;
      }

      try {
        await signUp.create({
          emailAddress: email,
          password,
        });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerify(true);
      } catch (error_) {
        setVerify(false);
        const error = error_ as { errors: Array<{ message: string }> };
        toast.error('Your sign in request failed. Please try again.', {
          description: <div>{error.errors[0]?.message}</div>,
        });
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
          <CardDescription>Enter your credentials below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <>
            <div className='grid gap-6'>
              {verify ? (
                <div className='flex min-h-[336px] w-full flex-col'>
                  <p className='text-primary text-lg'>Please insert the code we&apos;ve send to your email.</p>
                  <Verify />
                </div>
              ) : (
                <UserAuthForm btnLabel='Sign Up' onSubmit={handleRegister} />
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
        By clicking continue, you agree to our <a href={`${env.WebUrl}/terms`}>Terms of Service</a> and{' '}
        <a href={`${env.WebUrl}/privacy`}>Privacy Policy</a>.
      </div>
    </div>
  );
}

function Verify() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = route.useNavigate();
  const search = route.useSearch();
  const from = search.from ?? '/';

  const form = useForm({
    resolver: zodResolver(authCodeSchema),
    defaultValues: {
      code: '',
    },
    mode: 'onBlur',
  });

  const handleVerify = useCallback(
    async (data: AuthCodeSchema) => {
      if (!isLoaded) {
        return;
      }

      try {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: data.code,
        });

        if (completeSignUp.status !== 'complete') {
          toast.error('Your sign up request failed. Please try again.', {
            description: <div>{JSON.stringify(completeSignUp, undefined, 2)}</div>,
          });
        }

        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId });
          navigate({ to: from, replace: true });
        }
      } catch (error_) {
        const error = error_ as { errors: Array<{ message: string }> };
        toast.error('Your sign up request failed. Please try again.', {
          description: <div>{error.errors[0]?.message}</div>,
        });
      }
    },
    [from, isLoaded, navigate, setActive, signUp],
  );

  return (
    <div className='mt-6 grid gap-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleVerify)}>
          <div className='grid gap-6'>
            <div className='grid gap-1'>
              <FormField control={form.control} name='code' render={CodeField} />
            </div>
            <Button type='submit'>Verify Email</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function CodeField({ field }: { field: ControllerRenderProps<{ code: string }, 'code'> }) {
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
