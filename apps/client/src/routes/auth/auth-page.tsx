import { Dispatch, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { UserAuthForm } from '@/app/auth/auth-form';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStoreActions } from '@/stores/auth-store';

export function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Register'>('Login');

  // TODO add back button to navigate to the "web"-app
  return (
    <>
      {show === 'Register' && <Register toLogin={setShow} />}
      {show === 'Login' && <Login toRegister={setShow} />}
    </>
  );
}

function Register({ toLogin }: { toLogin: Dispatch<React.SetStateAction<'Login' | 'Register'>> }) {
  const { register } = useAuthStoreActions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (email: string, password: string) => {
    const result = await register(email.toLowerCase(), password);

    if (result.error != null) {
      toast({
        title: 'Something went wrong.',
        description: 'Your sign in request failed. Please try again.',
        variant: 'destructive',
      });
    }
    navigate('/');
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
          <Button variant='link' onClick={() => toLogin('Login')}>
            Have an account? Sign In
          </Button>
        </p>
      </div>
    </div>
  );
}

function Login({ toRegister }: { toRegister: Dispatch<React.SetStateAction<'Login' | 'Register'>> }) {
  const { login } = useAuthStoreActions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email.toLowerCase(), password);

    if (result.error != null) {
      toast({
        title: 'Something went wrong.',
        description: 'Your sign in request failed. Please try again.',
        variant: 'destructive',
      });
    }
    navigate(from);
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
          <Button variant='link' onClick={() => toRegister('Register')}>
            Don&apos;t have an account? Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
}
