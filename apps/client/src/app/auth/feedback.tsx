import { ApiError } from '@kijk/api/errors';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';

import { AppBrand } from '@/shared/components/app-brand';
import { InitLoader } from '@/shared/components/ui/loaders/init-loader';
import { useAppAuth } from '@/shared/runtime/auth';

interface AuthErrorProps extends ErrorComponentProps {}

/** Visible while the server session and Kijk account are checked before entering the app. */
export function AuthPending() {
  return <InitLoader />;
}

/** Keeps account-loading failures visible instead of sending a signed-in user to the landing page. */
export function AuthError({ error }: AuthErrorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn, signOut } = useAppAuth();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const detail = ApiError.isApiError(error)
    ? error.message
    : 'We could not verify your session. Please try again. If this continues, contact support.';

  async function retry() {
    setBusy(true);
    setActionError(undefined);
    try {
      await router.invalidate();
    } catch {
      setActionError('We could not retry your sign-in. Please reload the page.');
    }
    setBusy(false);
  }

  async function leave() {
    setBusy(true);
    setActionError(undefined);
    try {
      await signOut();
      queryClient.clear();
      await router.invalidate();
    } catch {
      setActionError('Sign-out could not be completed. Please try again.');
    }
    setBusy(false);
  }

  return (
    <main className='flex min-h-svh flex-1 flex-col items-center justify-center gap-6 p-6'>
      <AppBrand />
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <CardTitle>
            {isSignedIn ? 'Signed in, but your Kijk account could not be loaded' : 'Sign-in could not be completed'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div role='alert' className='space-y-2'>
            <p>{detail}</p>
            {actionError && <p>{actionError}</p>}
          </div>
          <div className='flex gap-3'>
            <Button disabled={busy} onClick={retry}>
              {busy ? 'Please wait…' : 'Try again'}
            </Button>
            {isSignedIn && (
              <Button disabled={busy} variant='outline' onClick={leave}>
                Sign out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
