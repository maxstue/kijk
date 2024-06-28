import { Dispatch, useCallback, useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { getRouteApi } from '@tanstack/react-router';
import { ControllerRenderProps } from 'react-hook-form';

import { UserAuthForm } from '@/app/auth/auth-form';
import { AuthCodeSchema, authCodeSchema } from '@/app/auth/schemas';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/hooks/use-toast';

const route = getRouteApi('/auth');

export function SignUp({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const [verify, setVerify] = useState<boolean>(false);
  const { isLoaded, signUp } = useSignUp();
  const { toast } = useToast();

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
      } catch (err) {
        setVerify(false);
        const error = err as { errors: Array<{ message: string }> };
        toast({
          title: 'Your sign in request failed. Please try again.',
          description: <div>{error.errors[0].message}</div>,
          variant: 'destructive',
        });
      }
    },
    [isLoaded, signUp, toast],
  );

  const handleGoToLogin = useCallback(() => {
    goto('Login');
  }, [goto]);

  return (
    <div className='container flex h-screen w-screen flex-col items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <Icons.logo className='mx-auto h-12 w-12 text-primary' />
          <h1 className='text-2xl font-semibold tracking-tight'>Create an account</h1>
          <p className='text-sm text-muted-foreground'>Enter your credentials below to create your account</p>
        </div>
        {verify ? (
          <div className='flex min-h-[336px] w-full flex-col'>
            <p className='text-lg text-primary'>Please insert the code we&apos;ve send to your email.</p>
            <Verify />
          </div>
        ) : (
          <UserAuthForm onSubmit={handleRegister} btnLabel='Sign Up' />
        )}
        <p className='px-8 text-center text-sm text-muted-foreground'>
          <Button variant='link' onClick={handleGoToLogin}>
            Have an account? Sign In
          </Button>
        </p>
      </div>
    </div>
  );
}

function Verify() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { toast } = useToast();
  const navigate = route.useNavigate();
  const search = route.useSearch();
  const from = search.from ?? '/';

  const form = useZodForm({
    schema: authCodeSchema,
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
          toast({
            title: 'Your sign up request failed. Please try again.',
            description: <div>{JSON.stringify(completeSignUp, null, 2)}</div>,
            variant: 'destructive',
          });
        }

        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId });
          navigate({ to: from, replace: true });
        }
      } catch (err) {
        const error = err as { errors: Array<{ message: string }> };
        toast({
          title: 'Your sign up request failed. Please try again.',
          description: <div>{error.errors[0].message}</div>,
          variant: 'destructive',
        });
      }
    },
    [from, isLoaded, navigate, setActive, signUp, toast],
  );
  return (
    <div className='mt-6 grid gap-6'>
      <Form form={form} onSubmit={handleVerify}>
        <div className='grid gap-6'>
          <div className='grid gap-1'>
            <FormField control={form.control} name='code' render={CodeField} />
          </div>
          <Button type='submit'>Verify Email</Button>
        </div>
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
