import { useState } from 'react';

import { AuthSchema, authSchema } from '@/app/auth/schemas';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form/form';
import { useZodForm } from '@/components/ui/form/use-zod-form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStoreActions } from '@/stores/auth-store';
import { AllowedProviders } from '@/types/app';

interface UserAuthFormProps {
  className?: string;
  btnLabel: string;
  onSubmit: (email: string, password: string) => Promise<unknown>;
}

export function UserAuthForm({ className, btnLabel, onSubmit }: UserAuthFormProps) {
  const form = useZodForm({
    schema: authSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { signInWith } = useAuthStoreActions();

  async function handleEmailSubmit(data: AuthSchema) {
    setIsLoading(true);
    await onSubmit(data.email.toLowerCase(), data.password);
    setIsLoading(false);
  }

  async function handleSignInWith(provider: AllowedProviders) {
    setIsLoading(true);
    await signInWith(provider);
    setIsLoading(false);
  }

  return (
    <div className={cn('grid gap-6', className)}>
      <Form form={form} onSubmit={handleEmailSubmit} className='space-y-8'>
        <div className='grid gap-2'>
          <div className='grid gap-1'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='grid gap-1'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    {/* TODO add eye symbol to toggle input visability*/}
                    <Input type='password' placeholder='Password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type='submit' disabled={isLoading}>
            {!isLoading && btnLabel}
            {isLoading && <Icons.spinner className='h-5 w-5 animate-spin' />}
          </Button>
        </div>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
        </div>
      </div>
      <Button variant='outline' onClick={() => handleSignInWith('github')} disabled={isLoading}>
        {isLoading ? (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <Icons.gitHub className='mr-2 h-4 w-4' />
        )}{' '}
        Github
      </Button>
    </div>
  );
}
