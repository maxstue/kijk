import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/terms')({ component: TermsOfService });

function TermsOfService() {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold'>Terms of Service</h1>
        <p className='text-muted-foreground'>Last updated: 5 September 2026</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Using Kijk</h2>
        <p>
          Kijk is a household-management service for recording and reviewing shared household information. By creating
          an account or using the service, you agree to these terms and to the Privacy Policy.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Your account</h2>
        <p>
          Keep your sign-in details confidential and provide accurate information. You are responsible for activity
          carried out through your account and for ensuring that anyone you invite to your household is authorised to
          access its information.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Your data</h2>
        <p>
          You retain responsibility for the information you add to Kijk. Do not upload unlawful content or data that you
          are not permitted to share. You can edit or remove your household information at any time; account and
          data-deletion instructions are available in Settings.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Acceptable use</h2>
        <p>
          Do not misuse the service, attempt unauthorised access, interfere with its operation, or use it to harm
          others. We may suspend access when necessary to protect the service, its users, or applicable law.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Availability and changes</h2>
        <p>
          We aim to keep Kijk available and reliable, but the service may be changed, interrupted, or discontinued for
          maintenance, security, or product reasons. We may update these terms when needed and will publish the latest
          version on this page.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Contact</h2>
        <p>
          For questions about these terms, account access, or data deletion, use the contact details shown in Settings →
          Info.
        </p>
      </section>
    </main>
  );
}
