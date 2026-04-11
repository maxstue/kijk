import { AuthenticateWithRedirectCallback } from '@clerk/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sso-callback')({
  // Handle the redirect flow by rendering the
  // Prebuilt AuthenticateWithRedirectCallback component.
  // This is the final step in the custom OAuth flow
  component: () => <AuthenticateWithRedirectCallback />,
});
