import { Dispatch, useState } from 'react';
import { redirect, useNavigate, useSearch } from '@tanstack/react-router';

import { UserAuthForm } from '@/app/auth/auth-form';
import { Head } from '@/components/head';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStoreActions } from '@/stores/auth-store';

export function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');

  // TODO add back button to navigate to the "web"-app
  return (
    <>
      <Head title={show} />
      {show === 'Sign Up' && <SignUp goto={setShow} />}
      {show === 'Login' && <Login goto={setShow} />}
    </>
  );
}

function SignUp({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const { register } = useAuthStoreActions();
  const { toast } = useToast();
  const navigate = useNavigate({ from: '/auth' });

  const handleRegister = async (email: string, password: string) => {
    const result = await register(email.toLowerCase(), password);

    if (result.error != null) {
      toast({
        title: 'Something went wrong.',
        description: 'Your sign in request failed. Please try again.',
        variant: 'destructive',
      });
    }
    void navigate({ to: '/' });
  };

  return (
    <div className='container flex h-screen w-screen flex-col items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <Icons.logo className='mx-auto h-6 w-6' />
          <h1 className='text-2xl font-semibold tracking-tight'>Create an account</h1>
          <p className='text-sm text-muted-foreground'>Enter your credentials below to create your account</p>
        </div>
        <UserAuthForm onSubmit={handleRegister} btnLabel='Sign Up' />
        <p className='px-8 text-center text-sm text-muted-foreground'>
          <Button variant='link' onClick={() => goto('Login')}>
            Have an account? Sign In
          </Button>
        </p>
      </div>
    </div>
  );
}

function Login({ goto }: { goto: Dispatch<React.SetStateAction<'Login' | 'Sign Up'>> }) {
  const { login } = useAuthStoreActions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth' });
  const from = search.from ?? '/';

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email.toLowerCase(), password);

    if (result.error != null) {
      toast({
        title: 'Something went wrong.',
        description: 'Your sign in request failed. Please try again.',
        variant: 'destructive',
      });
    }
    void navigate({ to: from, replace: true });
  };

  return (
    <div className='container flex h-screen w-screen flex-col items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <Icons.logo className='mx-auto h-6 w-6' />
          <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
          <p className='text-sm text-muted-foreground'>Enter your credentials to log in to your account</p>
        </div>
        <UserAuthForm onSubmit={handleLogin} btnLabel='Login' />
        <p className='px-8 text-center text-sm text-muted-foreground'>
          <Button variant='link' onClick={() => goto('Sign Up')}>
            Don&apos;t have an account? Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
}
