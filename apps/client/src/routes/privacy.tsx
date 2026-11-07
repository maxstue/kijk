import { createFileRoute } from '@tanstack/react-router';

import { PrivacyDataProcessing } from '@/app/privacy/data-processing';
import { PrivacyRights } from '@/app/privacy/rights';
import { PrivacyTelemetry } from '@/app/privacy/telemetry';
import { LegalContact } from '@/shared/components/legal-contact';

/** `/privacy`: privacy policy. */
export const Route = createFileRoute('/privacy')({ component: PrivacyPolicy });

function PrivacyPolicy() {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold'>Privacy Policy</h1>
        <p className='text-muted-foreground'>Last updated: 22 October 2026</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Controller</h2>
        <p>The controller responsible for processing your personal data in Kijk is:</p>
        <LegalContact />
        <p>Contact us at this address for any question about your data or to exercise your rights.</p>
      </section>

      <PrivacyDataProcessing />

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Sign in with Google</h2>
        <p>
          If you choose Google sign-in, Google shares basic account information with our authentication provider, Clerk,
          so we can authenticate you and connect your Google identity to your Kijk account. This may include your Google
          account identifier, email address, name, and profile image when available. We use this information only to
          create or access your Kijk account, maintain the sign-in connection, and identify your account in Kijk.
        </p>
        <p>
          Kijk does not request access to Gmail, Google Drive, Calendar, Contacts, or other Google services. We do not
          sell Google account information, use it for advertising, or use it to train AI or machine-learning models. We
          share Google sign-in information with Clerk to provide authentication. PostHog receives no Google account
          information; what it receives is described below. We do not provide Google passwords or Google API access
          tokens to PostHog.
        </p>
        <p>
          The Google identity connection is kept while your Kijk account is active. When you delete your account in
          Settings → Info, Kijk also deletes your sign-in at Clerk, which ends the connection to your Google identity.
          Google handles its own account records under its privacy terms.
        </p>
        <p>
          The production Google sign-in flow uses HTTPS. Google passwords remain with Google; Kijk does not receive
          them. The Google OAuth client secret is kept outside the browser and application source code. Kijk does not
          use Google access to call Google APIs.
        </p>
      </section>

      <PrivacyTelemetry />

      <PrivacyRights />
    </main>
  );
}
