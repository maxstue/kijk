import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { UserAuthForm } from '@/app/(auth)/_components/user-auth-form';
import { cn } from '@/lib/classnames';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';

export const metadata = {
  title: 'Create an account',
  description: 'Create an account to get started.',
};

export default function RegisterPage() {
  return (
    <div className='flex h-screen w-screen lg:max-w-none '>
      <div className='hidden h-full w-full bg-muted lg:block' />
      <div className='flex h-2/3 w-full flex-col justify-between lg:p-8'>
        <div className='flex w-full justify-between'>
          <Link href='/' className={cn(buttonVariants({ variant: 'ghost' }))}>
            <>
              <ChevronLeft className='mr-2 h-4 w-4' />
              Back
            </>
          </Link>
          <Link href='/login' className={cn(buttonVariants({ variant: 'ghost' }))}>
            Login
          </Link>
        </div>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-center'>
            <Icons.logo className='mx-auto h-6 w-6' />
            <h1 className='text-2xl font-semibold tracking-tight'>Create an account</h1>
            <p className='text-sm text-muted-foreground'>Enter your email below to create your account</p>
          </div>
          <Suspense fallback={<FormFallback />}>
            <UserAuthForm />
          </Suspense>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            By clicking continue, you agree to our{' '}
            <Link href='/terms' className='hover:text-brand underline underline-offset-4'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='hover:text-brand underline underline-offset-4'>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function FormFallback() {
  return <>Loading ...</>;
}
