import { useState } from 'react';

import { Login } from '@/app/auth/login';
import { SignUp } from '@/app/auth/sign-up';
import { Head } from '@/shared/components/head';

export const component = function AuthPage() {
  const [show, setShow] = useState<'Login' | 'Sign Up'>('Login');

  // TODO add back button to navigate to the "web"-app
  return (
    <>
      <Head title={show} />
      {show === 'Sign Up' && <SignUp goto={setShow} />}
      {show === 'Login' && <Login goto={setShow} />}
    </>
  );
};
