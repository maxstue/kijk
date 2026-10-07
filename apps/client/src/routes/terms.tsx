import { createFileRoute } from '@tanstack/react-router';

import { LegalContact } from '@/shared/components/legal-contact';

/** `/terms`: terms of service. */
export const Route = createFileRoute('/terms')({ component: TermsOfService });

function TermsOfService() {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold'>Terms of Service</h1>
        <p className='text-muted-foreground'>Last updated: 5 October 2026</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Using Kijk</h2>
        <p>
          Kijk is a service for understanding and planning what you use: resources you measure with limits, and your
          money with budgets, in a personal space and in spaces you share with others. By creating an account or using
          the service, you agree to these terms and to the Privacy Policy.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Your account and spaces</h2>
        <p>
          Keep your sign-in details confidential and provide accurate information. You are responsible for activity
          carried out through your account and for ensuring that anyone you add to a shared space is authorised to
          access its information. Members of a shared space see its shared data according to their role; private
          accounts and budgets are visible only to their owner.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Your data</h2>
        <p>
          You retain responsibility for the information you add to Kijk. Do not upload unlawful content or data that you
          are not permitted to share. Bank exports can contain information about other people, such as joint account
          holders or the people you pay; only upload them if you are allowed to use that information. You can edit or
          remove the information in your spaces at any time, and delete your account and all your data in Settings →
          Info.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Imports, budgets and AI suggestions</h2>
        <p>
          Importing a bank export replaces the transactions of the chosen account in every month the file covers
          completely. Check the review before you import. Categories suggested by rules or by the optional AI features
          can be wrong; they are proposals that you can correct at any time.
        </p>
        <p>
          Kijk is not a bank or a financial adviser. Budgets, statistics and suggestions are an aid for your own
          planning and are not financial, tax or legal advice. Your bank&apos;s records remain authoritative.
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
          maintenance, security, or product reasons. Features such as AI suggestions may be limited or offered as part
          of a paid plan. We may update these terms when needed and will publish the latest version on this page.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Contact</h2>
        <p>For questions about these terms, account access, or data deletion, contact:</p>
        <LegalContact />
      </section>
    </main>
  );
}
