import { useSignUp } from '@clerk/react/legacy';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Input } from '@kijk/ui/components/input';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import type { Dispatch } from 'react';
import { useForm } from 'react-hook-form';
import type { ControllerRenderProps } from 'react-hook-form';
import { toast } from 'sonner';

import { UserAuthForm } from '@/app/auth/auth-form';
import type { AuthCodeSchema } from '@/app/auth/schemas';
import { authCodeSchema } from '@/app/auth/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { config } from '@/shared/config';

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
        By clicking continue, you agree to our <a href={`${config.WebUrl}/terms`}>Terms of Service</a> and{' '}
        <a href={`${config.WebUrl}/privacy`}>Privacy Policy</a>.
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
    defaultValues: {
      code: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(authCodeSchema),
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
          navigate({ replace: true, to: from });
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
