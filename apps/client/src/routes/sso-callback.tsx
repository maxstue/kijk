import { AuthenticateWithRedirectCallback } from '@clerk/react';
import { createFileRoute } from '@tanstack/react-router';

import { AppBrand } from '@/shared/components/app-brand';

export const Route = createFileRoute('/sso-callback')({
  // Handle the redirect flow by rendering the
  // Prebuilt AuthenticateWithRedirectCallback component.
  // This is the final step in the custom OAuth flow
  component: SsoCallbackPage,
});

function SsoCallbackPage() {
  return (
    <main className='flex h-full flex-col items-center justify-center gap-6 p-6'>
      <AppBrand />
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
